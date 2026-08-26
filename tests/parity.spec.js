import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://localhost:8080';

// Expected project count derives from authored content files.
// NOTE: no import.meta here - Playwright treats such specs as ESM and breaks.
const PROJECT_COUNT = readdirSync(join(process.cwd(), 'content', 'projects'))
  .filter((f) => f.endsWith('.md'))
  .length;

const normalize = (text) => text.replace(/\s+/g, ' ').trim();

/** Split llms.txt's "## Selected Projects" region into {title: sectionLines}. */
function llmsProjectSections(llmsContent) {
  const start = llmsContent.indexOf('## Selected Projects');
  const afterSelected = llmsContent.substring(start);
  const sections = {};
  for (const chunk of afterSelected.split(/^### /m).slice(1)) {
    const [titleLine, ...lines] = chunk.split('\n');
    sections[normalize(titleLine)] = lines.map((l) => l.trim()).filter(Boolean);
  }
  return sections;
}

function fieldFromSection(lines, field) {
  const line = lines.find((l) => l.startsWith(`- ${field}: `));
  return line ? normalize(line.slice(field.length + 3)) : null;
}

test.describe('llms.txt <-> index.html Parity', () => {
  let llmsContent;
  let page;

  test.beforeAll(async ({ browser, request }) => {
    const llmsResponse = await request.get(BASE + '/llms.txt');
    expect(llmsResponse.ok()).toBeTruthy();
    llmsContent = await llmsResponse.text();

    page = await browser.newPage();
    await page.goto(BASE);
  });

  test('llms.txt should not be empty', () => {
    expect(llmsContent.trim().length).toBeGreaterThan(0);
  });

  test('llms.txt contains the site title', () => {
    expect(llmsContent).toContain('Jonathan Au');
  });

  test('project titles match exactly between llms.txt and index.html', async () => {
    const llmsProjects = Object.keys(llmsProjectSections(llmsContent));
    const htmlProjects = (await page.locator('h3.project-title').allInnerTexts()).map(normalize);

    // Counts must match each other and the number of authored content files
    expect(llmsProjects.length).toBe(PROJECT_COUNT);
    expect(htmlProjects.length).toBe(PROJECT_COUNT);

    // Exact set equality (order is unified: card order == llms.txt order)
    expect(llmsProjects).toEqual(htmlProjects);
  });

  test('project technologies match between llms.txt and index.html', async () => {
    const sections = llmsProjectSections(llmsContent);

    const htmlTechByTitle = {};
    const cards = await page.locator('article.project-card').all();
    for (const card of cards) {
      const title = normalize(await card.locator('h3.project-title').innerText());
      const tech = await card.locator('.project-tech li').allInnerTexts();
      htmlTechByTitle[title] = tech.map(normalize).join(', ');
    }

    for (const [title, lines] of Object.entries(sections)) {
      const llmsTech = fieldFromSection(lines, 'Technologies');
      expect(llmsTech, `${title} has Technologies in llms.txt`).not.toBeNull();
      expect(htmlTechByTitle[title], `${title} exists in index.html`).toBeDefined();
      expect(llmsTech, `${title} technologies`).toBe(htmlTechByTitle[title]);
    }
  });

  test('llms.txt project count matches authored content files', () => {
    expect(Object.keys(llmsProjectSections(llmsContent)).length).toBe(PROJECT_COUNT);
  });

  test('sitemap.xml is referenced in robots.txt', async ({ request }) => {
    const robotsResponse = await request.get(BASE + '/robots.txt');
    const robotsText = await robotsResponse.text();
    expect(robotsText).toContain('Sitemap:');
    expect(robotsText).toContain('sitemap.xml');
  });

  test('sitemap.xml is valid XML', async ({ request }) => {
    const sitemapResponse = await request.get(BASE + '/sitemap.xml');
    expect(sitemapResponse.ok()).toBeTruthy();
    const text = await sitemapResponse.text();
    expect(text).toContain('<?xml');
    expect(text).toContain('<urlset');
    expect(text).toContain('</urlset>');
  });

  test('robots.txt allows major AI crawlers', async ({ request }) => {
    const robotsResponse = await request.get(BASE + '/robots.txt');
    const text = await robotsResponse.text();
    expect(text).toContain('GPTBot');
    expect(text).toContain('ClaudeBot');
    expect(text).toContain('PerplexityBot');
  });

  test('robots.txt blocks Bytespider', async ({ request }) => {
    const robotsResponse = await request.get(BASE + '/robots.txt');
    const text = await robotsResponse.text();
    expect(text).toContain('Bytespider');
    expect(text).toContain('Disallow: /');
  });
});