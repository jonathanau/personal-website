# Personal Portfolio

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/jonathanau/personal-website/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanau/personal-website/actions/workflows/ci.yml)

A premium, responsive personal portfolio website built with standard HTML, CSS, and vanilla JavaScript. 

Features a state-of-the-art dark mode design with glassmorphism, fluid scroll animations, and a mobile-optimized layout.

## Running Locally

Because the project uses standard web technologies, no build step is required to serve or deploy it — the generated output (`index.html`, `llms.txt`) is committed. You can simply open `index.html` in your web browser, or run a local server:

```bash
python3 -m http.server 8080
```

Then navigate to `http://localhost:8080` in your browser.

## Editing Content

All site copy (projects, experience, about text) is authored once in `content/` as markdown files with YAML frontmatter, then generated into `index.html` and `llms.txt` by a zero-dependency Node script:

```
content/
  projects/    # one .md per project — frontmatter: title, category,
               # applicationCategory (optional), url and/or repo, tech, order;
               # body = project description
  experience/  # one .md per role — frontmatter: company, role, period;
               # body = description
  profile.md   # frontmatter: name, heading, description, linkedin, skills;
               # body = about paragraphs
```

After editing or adding files, regenerate the committed outputs:

```bash
npm run content          # regenerate index.html sections + llms.txt
npm run content:check    # fails if committed outputs are stale (CI gate)
```

Content is validated during generation: required fields must be present, URLs must be https, slugs must be URL-safe, project titles unique, descriptions non-empty. Adding a project means creating one new file in `content/projects/` and running `npm run content` — the project card, JSON-LD structured data, and llms.txt entry are all derived automatically.

Editing content requires Node 18+ (no npm packages needed); serving and deploying the site does not.

## License and Usage Rights

The underlying **source code** for the website (HTML structure, CSS styling, JavaScript animations, and the content generator in `scripts/`) is open-sourced under the [MIT License](LICENSE). You are welcome to fork this repository, use the code as a template, and modify it for your own portfolio. 

**However, the personal content (including the "About Me" text, specific project descriptions, names, and any personal photos/assets — whether in `index.html` or authored under `content/`) is NOT covered by the MIT License.** Please ensure you replace all personal information with your own content before publishing your version of the site.
