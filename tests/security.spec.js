import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';

test.describe('Security & Headers', () => {
  // These tests verify what the _headers file configures.
  // Playwright can only test response headers from a live server.
  // We test header presence/values when served via Netlify (_headers).

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
  });

  test('CSP meta tag exists and contains expected directives', async ({ page }) => {
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('outbound links have rel=noopener noreferrer', async ({ page }) => {
    const outbound = page.locator('a[href^="https://"]');
    const count = await outbound.count();

    for (let i = 0; i < count; i++) {
      const link = outbound.nth(i);
      const rel = (await link.getAttribute('rel')) || '';
      // skip javascript:void links if any
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('javascript')) continue;
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('no mixed content — all resources use https or relative paths', async ({ page }) => {
    const links = page.locator('a[href^="http://"]');
    const count = await links.count();
    expect(count).toBe(0);

    const scripts = page.locator('script[src^="http://"]');
    expect(await scripts.count()).toBe(0);

    const imgs = page.locator('img[src^="http://"]');
    expect(await imgs.count()).toBe(0);
  });

  test('iframe ancestors blocked via CSP', async ({ page }) => {
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("frame-ancestors 'none'");
  });
});