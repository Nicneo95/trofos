import { test, type Page } from '@playwright/test';
import { loginAsTestUser } from './auth';

const BASE_URL = 'https://trofos-production.comp.nus.edu.sg/';

/**
 * Ensures the page is authenticated before each test.
 * Tries the storageState cookie first; falls back to a fresh login if the
 * session was not restored (e.g. proxy strips cookie attributes in CI).
 */
async function ensureAuthenticated(page: Page, label: string): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const homeMenu = page.getByRole('menuitem', { name: /home/i }).first();
  const isAuthenticated = await homeMenu.isVisible().catch(() => false);

  if (!isAuthenticated) {
    console.log(`[${label}] StorageState session not valid — doing fresh login`);
    await loginAsTestUser(page);
  }
}

export const authenticatedTest = test.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await ensureAuthenticated(page, 'fixture');
    await use(page);
  },
});
