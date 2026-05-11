import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = 'http://localhost:8080';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('skip link or focus management', async ({ page, browserName }) => {
    // WebKit (Safari) requires OS-level settings for Tab to focus links/buttons natively
    test.skip(browserName === 'webkit', 'WebKit tab focus behavior differs on macOS');
    
    // Verify page is focusable after load
    await page.keyboard.press('Tab');
    const activeElement = page.locator(':focus');
    await expect(activeElement).toHaveCount(1);
  });
});