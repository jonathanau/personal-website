import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';

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

  test('llms.txt projects match projects in index.html', async () => {
    // Only count ### lines that appear AFTER "## Selected Projects"
    const selectedProjectsStart = llmsContent.indexOf('## Selected Projects');
    const afterSelected = llmsContent.substring(selectedProjectsStart);
    const llmsProjectMatches = afterSelected.match(/^### (.+)$/gm) || [];
    const llmsProjects = llmsProjectMatches.map(m => m.replace('### ', '').trim());

    // Extract project titles directly using Playwright locator
    const htmlProjects = await page.locator('h3.project-title').allInnerTexts();
    // Clean up formatting of the inner text
    const cleanHtmlProjects = htmlProjects.map(t => t.replace(/\s+/g, ' ').trim());

    console.log('llms.txt projects:', JSON.stringify(llmsProjects));
    console.log('index.html projects:', JSON.stringify(cleanHtmlProjects));

    // Counts must match
    expect(llmsProjects.length).toBe(cleanHtmlProjects.length);

    // Every project in llms.txt should exist in index.html
    for (const project of llmsProjects) {
      const found = cleanHtmlProjects.some(p => p.toLowerCase().includes(project.toLowerCase()) || project.toLowerCase().includes(p.toLowerCase()));
      expect(found).toBeTruthy();
    }

    // Every project in index.html should exist in llms.txt
    for (const project of cleanHtmlProjects) {
      const found = llmsProjects.some(p => p.toLowerCase().includes(project.toLowerCase()) || project.toLowerCase().includes(p.toLowerCase()));
      expect(found).toBeTruthy();
    }
  });

  test('llms.txt lists exactly 7 projects', () => {
    const selectedProjectsStart = llmsContent.indexOf('## Selected Projects');
    const afterSelected = llmsContent.substring(selectedProjectsStart);
    const projectMatches = afterSelected.match(/^### (.+)$/gm) || [];
    expect(projectMatches.length).toBe(7);
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