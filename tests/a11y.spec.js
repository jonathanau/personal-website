import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = 'http://localhost:8080';

test.use({ bypassCSP: true });

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'load' });
    // Disable animations and transitions so accessibility color contrast audits evaluate final settled states
    await page.addStyleTag({
      content: '* { transition: none !important; animation: none !important; transition-delay: 0s !important; }'
    });
    await page.waitForTimeout(500);
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