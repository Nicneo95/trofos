import { test, expect, type Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

async function openUserMenu(page: Page): Promise<void> {
  await page.locator('.avatar-group').click({ timeout: 10000 });
  await page.getByText('Log Out').first().waitFor({ state: 'visible', timeout: 10000 });
}

// Always use a fresh login so logout doesn't invalidate the shared storageState session
// that all other qa-chrome tests depend on.
// Explicitly empty state so this test does NOT inherit the project's auth-state-chromium.json.
// Setting storageState: undefined in test.use() falls back to the project default (still authenticated),
// which would hide the Login button. An empty object forces a fresh unauthenticated context.
test.use({ storageState: { cookies: [], origins: [] } });

test('[Logout] 11.1 - User can log out successfully', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000);

  await loginAsTestUser(page);

  // Ensure we are in authenticated app shell before opening account menu.
  await expect(page.getByRole('menuitem', { name: /home/i }).first()).toBeVisible({ timeout: 15000 });

  await openUserMenu(page);
  await page.getByText('Log Out').first().click();

  // Verify user is logged out and redirected to public/unauthenticated view.
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 15000 });
});
