#!/usr/bin/env node
/**
 * build-content - zero-dependency static content generator.
 *
 * Single source of truth: content/*.md (frontmatter + markdown body).
 * Generates, into committed static files:
 *   - index.html : project cards, experience timeline, about section,
 *                  ItemList JSON-LD  (between generated:*:start/end markers)
 *   - llms.txt   : full AI-ingestible site summary
 *
 * Usage:
 *   node scripts/build-content.mjs           # regenerate outputs
 *   node scripts/build-content.mjs --check   # exit 1 if committed outputs are stale
 *
 * No npm dependencies. Requires Node >= 18.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = join(ROOT, 'content');
const INDEX_HTML = join(ROOT, 'index.html');
const LLMS_TXT = join(ROOT, 'llms.txt');

/* ── Frontmatter parsing ─────────────────────────────────────────────── */

/** Parse `---\nfrontmatter\n---\nbody` into { data, body }. */
export function parseFrontmatter(raw, file = '<input>') {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`${file}: missing --- frontmatter fence`);
  const [, fmRaw, body] = match;

  const data = Object.create(null);
  let currentKey = null;
  for (const line of fmRaw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const listItem = /^-\s+(.+)$/.exec(trimmed);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        throw new Error(`${file}: list items under \`${currentKey}\` but key is not a list`);
      }
      data[currentKey].push(unquote(listItem[1]));
      continue;
    }

    const kv = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(trimmed);
    if (!kv) throw new Error(`${file}: cannot parse frontmatter line: "${trimmed}"`);
    currentKey = kv[1];
    const value = kv[2].trim();

    if (value === '') {
      data[currentKey] = []; // block list expected on following lines
    } else if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[currentKey] = inner ? inner.split(',').map((part) => unquote(part.trim())) : [];
    } else {
      data[currentKey] = unquote(value);
    }
  }
  return { data, body };
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/* ── Markdown rendering (deliberately minimal) ───────────────────────── */

/** Escape a string for safe interpolation into HTML text/attributes. */
export function escHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Inline markdown -> HTML. Input must already be HTML-escaped. */
function renderInline(escaped) {
  return escaped
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** Render a markdown body (paragraphs + inline styles) to HTML. */
export function renderBody(markdown) {
  return markdown
    .trim()
    .split(/\n\s*\n/)
    .map((para) => `<p>${renderInline(escHtml(para.replace(/\s+/g, ' ').trim()))}</p>`)
    .join('\n');
}

/** Render a markdown body to plain text (for JSON-LD / llms.txt). */
export function plainText(markdown) {
  return markdown
    .trim()
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ');
}

/* ── Validation ──────────────────────────────────────────────────────── */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_RE = /^https:\/\/\S+$/;
const APPLICATION_CATEGORIES = new Set([
  'DeveloperApplication',
  'GameApplication',
  'EducationalApplication',
]);
const PERIODS = new Set(['Current', 'Previous']);

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

class ValidationError extends Error {}

function requireField(file, data, field) {
  if (!isNonEmptyString(data[field])) {
    throw new ValidationError(`${file}: \`${field}\` must be a non-empty string`);
  }
  return data[field];
}

function requireHttpsUrl(file, data, field) {
  const value = data[field];
  if (value === undefined) return undefined;
  if (!isNonEmptyString(value) || !HTTPS_RE.test(value)) {
    throw new ValidationError(`${file}: \`${field}\` must be an https:// URL`);
  }
  return value;
}

function requireStringArray(file, data, field) {
  const value = data[field];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((item) => isNonEmptyString(item))
  ) {
    throw new ValidationError(`${file}: \`${field}\` must be a non-empty list`);
  }
  return value;
}

/** Validate one project file. Returns normalized project. */
function normalizeProject(slug, { data, body }) {
  const file = `content/projects/${slug}.md`;
  if (!SLUG_RE.test(slug)) {
    throw new ValidationError(
      `${file}: slug must be lowercase a-z/0-9/dashes (got "${slug}")`,
    );
  }
  requireField(file, data, 'title');
  requireField(file, data, 'category');
  const applicationCategory =
    data.applicationCategory === undefined
      ? 'DeveloperApplication'
      : data.applicationCategory;
  if (!APPLICATION_CATEGORIES.has(applicationCategory)) {
    throw new ValidationError(
      `${file}: \`applicationCategory\` must be one of ${[...APPLICATION_CATEGORIES].join(', ')}`,
    );
  }
  const url = requireHttpsUrl(file, data, 'url');
  const repo = requireHttpsUrl(file, data, 'repo');
  if (!url && !repo) {
    throw new ValidationError(`${file}: needs \`url\` and/or \`repo\``);
  }
  const tech = requireStringArray(file, data, 'tech');
  if (!isNonEmptyString(body)) {
    throw new ValidationError(`${file}: body (description) must not be empty`);
  }
  return {
    slug,
    title: data.title,
    category: data.category,
    applicationCategory,
    url,
    repo,
    tech,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : Number.MAX_SAFE_INTEGER,
    descriptionHtml: renderInline(escHtml(plainText(body))),
    descriptionText: plainText(body),
  };
}

/** Validate one experience file. Returns normalized entry. */
function normalizeExperience(slug, { data, body }) {
  const file = `content/experience/${slug}.md`;
  if (!SLUG_RE.test(slug)) {
    throw new ValidationError(
      `${file}: slug must be lowercase a-z/0-9/dashes (got "${slug}")`,
    );
  }
  requireField(file, data, 'company');
  requireField(file, data, 'role');
  const period = requireField(file, data, 'period');
  if (!PERIODS.has(period)) {
    throw new ValidationError(`${file}: \`period\` must be Current or Previous`);
  }
  if (!isNonEmptyString(body)) {
    throw new ValidationError(`${file}: body (description) must not be empty`);
  }
  return {
    slug,
    company: data.company,
    role: data.role,
    period,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : Number.MAX_SAFE_INTEGER,
    descriptionText: plainText(body),
  };
}

/** Validate profile.md. Returns normalized profile. */
function normalizeProfile({ data, body }) {
  const file = 'content/profile.md';
  requireField(file, data, 'name');
  requireField(file, data, 'heading');
  requireField(file, data, 'description');
  requireHttpsUrl(file, data, 'linkedin');
  requireStringArray(file, data, 'skills');
  const paragraphs = body.trim().split(/\n\s*\n/).filter(isNonEmptyString);
  if (paragraphs.length === 0) {
    throw new ValidationError(`${file}: body must contain at least one paragraph`);
  }
  return {
    name: data.name,
    heading: data.heading,
    description: data.description,
    linkedin: data.linkedin,
    skills: data.skills,
    paragraphsHtml: renderBody(body).split('\n'),
    paragraphsText: paragraphs.map((p) => plainText(p)),
  };
}

function readCollection(dir, normalizer) {
  if (!existsSync(dir)) {
    throw new ValidationError(`${dir}: directory not found`);
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
  if (files.length === 0) {
    throw new ValidationError(`${dir}: no .md files found`);
  }
  return files.map((f) =>
    normalizer(basename(f, '.md'), parseFrontmatter(readFileSync(join(dir, f), 'utf8'), f)),
  );
}

function sortByOrder(list) {
  return [...list].sort(
    (a, b) => a.order - b.order || a.slug.localeCompare(b.slug),
  );
}

/**
 * Load + validate all content under `baseDir`.
 * Throws ValidationError (aggregate message) on any problem.
 */
export function collectContent(baseDir = CONTENT_DIR) {
  const errors = [];
  const projects = [];
  const experience = [];

  try {
    for (const p of readCollection(join(baseDir, 'projects'), normalizeProject)) projects.push(p);
  } catch (err) {
    errors.push(err.message);
  }
  try {
    for (const e of readCollection(join(baseDir, 'experience'), normalizeExperience)) experience.push(e);
  } catch (err) {
    errors.push(err.message);
  }
  let profile = null;
  try {
    profile = normalizeProfile(
      parseFrontmatter(readFileSync(join(baseDir, 'profile.md'), 'utf8'), 'profile.md'),
    );
  } catch (err) {
    errors.push(err.message);
  }

  // Detect duplicates among successfully parsed projects even if other
  // collections had errors, so all problems surface together.
  const titles = projects.map((p) => p.title.toLowerCase());
  const duplicate = titles.find((t, i) => titles.indexOf(t) !== i);
  if (duplicate) {
    errors.push(`content/projects: duplicate title "${duplicate}"`);
  }

  if (errors.length > 0) throw new ValidationError(errors.join('\n'));

  return { projects: sortByOrder(projects), experience: sortByOrder(experience), profile };
}

/* ── HTML emitters ───────────────────────────────────────────────────── */

const IND = '    ';

function projectLinks(project) {
  const links = [];
  if (project.repo) {
    links.push(
      `<a href="${escHtml(project.repo)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository"><i class="ph ph-github-logo"></i></a>`,
    );
  }
  const demoHref = project.url ?? project.repo;
  links.push(
    `<a href="${escHtml(demoHref)}" target="_blank" rel="noopener noreferrer" aria-label="Live Demo"><i class="ph ph-arrow-up-right"></i></a>`,
  );
  return links.join('\n' + IND.repeat(8));
}

/** Emit one `.project-card` article (indented for index.html's grid). */
export function renderProjectCard(project) {
  const i = IND.repeat(4); // article level
  const titleHref = project.url ?? project.repo;
  return [
    `${i}<article class="project-card glass-card reveal">`,
    `${i}${IND}<div class="project-content">`,
    `${i}${IND.repeat(2)}<div class="project-header">`,
    `${i}${IND.repeat(3)}<span class="project-category">${escHtml(project.category)}</span>`,
    `${i}${IND.repeat(3)}<div class="project-links">`,
    `${i}${IND.repeat(4)}${projectLinks(project)}`,
    `${i}${IND.repeat(3)}</div>`,
    `${i}${IND.repeat(2)}</div>`,
    `${i}${IND.repeat(2)}<h3 class="project-title">`,
    `${i}${IND.repeat(3)}<a href="${escHtml(titleHref)}" target="_blank"`,
    `${i}${IND.repeat(4)}rel="noopener noreferrer">${escHtml(project.title)}</a>`,
    `${i}${IND.repeat(2)}</h3>`,
    `${i}${IND.repeat(2)}<p class="project-description">`,
    `${i}${IND.repeat(3)}${project.descriptionHtml}`,
    `${i}${IND.repeat(2)}</p>`,
    `${i}${IND.repeat(2)}<ul class="project-tech">`,
    project.tech.map((t) => `${i}${IND.repeat(3)}<li>${escHtml(t)}</li>`).join('\n'),
    `${i}${IND.repeat(2)}</ul>`,
    `${i}${IND}</div>`,
    `${i}</article>`,
  ].join('\n');
}

/** Emit one `.timeline-item` div (indented for index.html's timeline). */
export function renderTimelineItem(entry) {
  const i = IND.repeat(4); // item level
  return [
    `${i}<div class="timeline-item glass-card">`,
    `${i}${IND}<div class="timeline-marker"></div>`,
    `${i}${IND}<div class="timeline-header">`,
    `${i}${IND.repeat(2)}<h3 class="timeline-role">${escHtml(entry.role)}</h3>`,
    `${i}${IND.repeat(2)}<span class="timeline-date">${escHtml(entry.period)}</span>`,
    `${i}${IND}</div>`,
    `${i}${IND}<p class="timeline-company">${escHtml(entry.company)}</p>`,
    `${i}${IND}<p class="timeline-description">${escHtml(entry.descriptionText)}</p>`,
    `${i}</div>`,
  ].join('\n');
}

/** Emit the inner content of `.about-text` (paragraphs + tech stack). */
export function renderAbout(profile) {
  const i = IND.repeat(5); // children of .about-text
  const paragraphs = profile.paragraphsHtml.map((p) => `${i}${p}`);
  const tags = profile.skills.map((s) => `${i}${IND}<span class="tech-tag">${escHtml(s)}</span>`);
  return [
    ...paragraphs,
    `${i}<div class="tech-stack">`,
    ...tags,
    `${i}</div>`,
  ].join('\n');
}

/** Emit the ItemList JSON-LD script block (indented for index.html head). */
export function renderItemListJsonLd(projects) {
  const itemListElement = projects.map((project, index) => {
    const item = {
      '@type': 'SoftwareApplication',
      name: project.title,
      applicationCategory: project.applicationCategory,
      description: project.descriptionText,
    };
    if (project.url) item.url = project.url;
    if (project.repo) item.codeRepository = project.repo;
    return { '@type': 'ListItem', position: index + 1, item };
  });
  const json = JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement },
    null,
    2,
  ).replaceAll('<', '\\u003c');

  const indented = json.split('\n').map((line) => IND + line).join('\n');
  return [
    `${IND}<script type="application/ld+json">`,
    indented,
    `${IND}</script>`,
  ].join('\n');
}

/* ── llms.txt emitter ────────────────────────────────────────────────── */

/** Emit the full llms.txt document. */
export function renderLlmsTxt({ projects, experience, profile }) {
  const lines = [
    `# ${profile.heading}`,
    '',
    `> ${profile.description}`,
    '',
    '## About',
    '',
    ...profile.paragraphsText.flatMap((p) => [p, '']),
    '### Skills',
    '',
    ...profile.skills.map((s) => `- ${s}`),
    '',
    '## Experience',
    '',
  ];

  for (const entry of experience) {
    lines.push(
      `### ${entry.company}`,
      `- Role: ${entry.role}`,
      `- Description: ${entry.descriptionText}`,
      '',
    );
  }

  lines.push('## Selected Projects', '');
  for (const project of projects) {
    lines.push(`### ${project.title}`);
    lines.push(`- Category: ${project.category}`);
    if (project.url) lines.push(`- URL: ${project.url}`);
    if (project.repo) lines.push(`- Repository: ${project.repo}`);
    lines.push(`- Description: ${project.descriptionText}`);
    lines.push(`- Technologies: ${project.tech.join(', ')}`);
    lines.push('');
  }

  lines.push('## Contact', '', `- LinkedIn: ${profile.linkedin}`, '');
  return lines.join('\n');
}

/* ── Marker injection ────────────────────────────────────────────────── */

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace the region between two marker comments in `html`. */
export function injectRegion(html, marker, content) {
  const start = `<!-- generated:${marker}:start -->`;
  const end = `<!-- generated:${marker}:end -->`;
  const pattern = new RegExp(`([ \\t]*)${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!pattern.test(html)) {
    throw new Error(`index.html: markers for "${marker}" not found`);
  }
  // Function replacement: avoids `$` sequences in content being interpreted;
  // reuses the start marker's indentation for the end marker.
  return html.replace(pattern, (_match, indent) => `${indent}${start}\n${content}\n${indent}${end}`);
}

/* ── Main ────────────────────────────────────────────────────────────── */

export function buildOutputs(content) {
  const indexHtml = readFileSync(INDEX_HTML, 'utf8');
  const updated = [
    ['projects', content.projects.map(renderProjectCard).join('\n')],
    ['itemlist', renderItemListJsonLd(content.projects)],
    ['timeline', content.experience.map(renderTimelineItem).join('\n')],
    ['about', renderAbout(content.profile)],
  ].reduce((html, [marker, region]) => injectRegion(html, marker, region), indexHtml);

  return { 'index.html': updated, 'llms.txt': renderLlmsTxt(content) };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  let outputs;
  try {
    outputs = buildOutputs(collectContent());
  } catch (err) {
    console.error(`✗ content invalid:\n${err.message}`);
    process.exit(1);
  }

  if (checkOnly) {
    const stale = Object.entries(outputs).filter(([name, expected]) => {
      const diskPath = name === 'index.html' ? INDEX_HTML : LLMS_TXT;
      return readFileSync(diskPath, 'utf8') !== expected;
    });
    if (stale.length > 0) {
      console.error(
        `✗ stale generated output: ${stale.map(([name]) => name).join(', ')}\n` +
          '  Run `npm run content` and commit the results.',
      );
      process.exit(1);
    }
    console.log('✓ generated outputs are up to date');
    return;
  }

  writeFileSync(INDEX_HTML, outputs['index.html']);
  writeFileSync(LLMS_TXT, outputs['llms.txt']);
  console.log('✓ index.html and llms.txt regenerated from content/');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
