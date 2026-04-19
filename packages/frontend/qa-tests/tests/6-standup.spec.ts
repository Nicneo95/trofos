import { test, expect, type Page } from '@playwright/test';

// SHARED FIXTURE — reuse authenticated session, navigate to Stand Up page

const standUpTest = test.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to home with retry — parallel workers can cause landing-page flakiness
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await page.goto('https://trofos-production.comp.nus.edu.sg/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(1500);

      const homeMenu = page.getByRole('menuitem', { name: /home/i }).first();
      const isAuthenticated = await homeMenu.isVisible().catch(() => false);
      if (isAuthenticated) break;

      if (attempt < maxRetries) {
        console.log(`[StandUp fixture] Attempt ${attempt}: dashboard not ready. Reloading…`);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
      } else {
        await homeMenu.waitFor({ state: 'visible', timeout: 15000 });
      }
    }

    // Navigate to "Test Project" (preferred), fallback to first available project
    const projectsMenu = page.getByRole('menuitem', { name: 'project Project' });
    await expect(projectsMenu).toBeVisible();
    await projectsMenu.click();
    await page.locator('a[href^="/project/"]').first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

    const testProject = page.locator('a[href^="/project/"]').filter({ hasText: 'Test Project' }).first();
    const firstProject = page.locator('a[href^="/project/"]:not([href*="example"])').first();

    if (await testProject.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testProject.click();
    } else {
      await expect(firstProject).toBeVisible();
      await firstProject.click();
    }

    await page.waitForURL('**/project/**');
    await page.waitForLoadState('domcontentloaded');

    // Retry if server returned error page under load
    for (let retryNav = 0; retryNav < 3; retryNav++) {
      const projectError = await page.getByText('This project does not exist!').isVisible({ timeout: 2000 }).catch(() => false);
      if (!projectError) break;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Navigate to Stand Up page via sidebar menu
    await page.getByRole('menuitem', { name: 'Stand Up' }).click();
    await page.waitForTimeout(1000);

    await use(page);
  },
});

// STAND UP TESTS — Section 6

// Keep default mode so failures do not skip the remaining tests in this file

  // ── 6.0  Cleanup leftover Stand Up data ──────────────────────────
  standUpTest('[Stand Up] 6.0 - Cleanup leftover Stand Up data', async ({ authenticatedPage: page }) => {
    const settingBtn = page.getByRole('button', { name: 'setting' });

    // Use .first() on every operation — multiple stand-ups may exist from previous failed runs
    for (let safety = 0; safety < 10; safety++) {
      if (!await settingBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) break;

      await settingBtn.first().click();
      await page.waitForTimeout(300);

      const deleteItem = page.getByRole('menuitem', { name: 'delete delete' });
      if (await deleteItem.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteItem.click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: 'OK' }).click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
        break;
      }
    }
  });

  // ── 6.1  Create Stand Up ─────────────────────────────────────────
  standUpTest('[Stand Up] 6.1 - Create Stand Up', async ({ authenticatedPage: page }) => {
    // Open the creation form
    await page.getByRole('button', { name: 'open-form' }).click();
    await page.waitForTimeout(500);

    // Open date picker
    await page.locator('.ant-picker-input').click();
    await page.waitForTimeout(300);

    // Select day 25 (always a future date relative to mid-month runs)
    await page.getByText('25', { exact: true }).click();
    await page.waitForTimeout(300);

    // Submit
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForTimeout(1000);

    // Verify Stand Up was created — at least one settings gear should appear
    await expect(page.getByRole('button', { name: 'setting' }).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 6.2  Edit Stand Up date ──────────────────────────────────────
  standUpTest('[Stand Up] 6.2 - Edit Stand Up date', async ({ authenticatedPage: page }) => {
    // Ensure stand-up exists
    await expect(page.getByRole('button', { name: 'setting' }).first()).toBeVisible({ timeout: 5000 });

    // Open settings dropdown → edit (use .first() — multiple stand-ups may exist)
    await page.getByRole('button', { name: 'setting' }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('menuitem', { name: 'edit edit' }).click();
    await page.waitForTimeout(500);

    // Open the date picker in the edit form and change to day 20
    await page.locator('.ant-picker-input').last().click();
    await page.waitForTimeout(300);
    await page.getByText('20', { exact: true }).click();
    await page.waitForTimeout(300);

    // Submit edit
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForTimeout(500);

    // Handle "All notes will be moved" confirmation dialog if it appears
    const confirmDialog = page.getByText('All notes will be moved to');
    if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(500);
    }

    // Verify success toast
    await expect(page.getByText('Stand Up updated!')).toBeVisible({ timeout: 5000 });
  });

  // ── 6.3  Add notes to Stand Up ──────────────────────────────────
  standUpTest('[Stand Up] 6.3 - Add notes to Stand Up', async ({ authenticatedPage: page }) => {
    // Make this test self-contained: create a stand-up if 6.1 didn't run in the same shard.
    const dateLink = page.getByRole('link').filter({
      hasText: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} \w{3} \d{4}$/,
    }).first();

    const hasDateLink = await dateLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasDateLink) {
      await page.getByRole('button', { name: 'open-form' }).click();
      await page.waitForTimeout(500);
      await page.locator('.ant-picker-input').click();
      await page.waitForTimeout(300);
      await page.getByText('25', { exact: true }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Finish' }).click();
      await page.waitForTimeout(1000);
    }

    await expect(dateLink).toBeVisible({ timeout: 8000 });
    await dateLink.click();
    await page.waitForTimeout(500);

    // Fill the 3 stand-up note fields and press Enter to submit each
    const textboxes = page.getByRole('textbox', { name: 'Type something here...' });

    // Field 1 — What I did yesterday
    await textboxes.nth(0).click();
    await textboxes.nth(0).fill('AutoTest - What I did yesterday');
    await textboxes.nth(0).press('Enter');
    await page.waitForTimeout(500);

    // Field 2 — What I will do today
    await textboxes.nth(1).click();
    await textboxes.nth(1).fill('AutoTest - What I will do today');
    await textboxes.nth(1).press('Enter');
    await page.waitForTimeout(500);

    // Field 3 — Blockers
    await textboxes.nth(2).click();
    await textboxes.nth(2).fill('AutoTest - Any blockers');
    await textboxes.nth(2).press('Enter');
    await page.waitForTimeout(500);

    // Verify notes were saved — delete buttons should appear for each note
    await expect(page.getByRole('button', { name: 'delete' }).first()).toBeVisible({ timeout: 5000 });
  });

  // ── 6.4  Delete notes from Stand Up ─────────────────────────────
  standUpTest('[Stand Up] 6.4 - Delete notes from Stand Up', async ({ authenticatedPage: page }) => {
    // Navigate to the date that has notes
    const dateLink = page.getByRole('link').filter({
      hasText: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} \w{3} \d{4}$/,
    }).first();
    await expect(dateLink).toBeVisible({ timeout: 5000 });
    await dateLink.click();
    await page.waitForTimeout(500);

    // Delete all notes one by one
    for (let i = 0; i < 5; i++) {
      const deleteBtn = page.getByRole('button', { name: 'delete' }).first();
      if (!await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) break;
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify all notes are deleted — no delete buttons remain
    await expect(page.getByRole('button', { name: 'delete' })).toHaveCount(0, { timeout: 5000 });
  });

  // ── 6.5  Delete Stand Up (cleanup) ──────────────────────────────
  standUpTest('[Stand Up] 6.5 - Delete Stand Up (cleanup)', async ({ authenticatedPage: page }) => {
    // Delete ALL stand-ups — 6.3's fallback may have created an extra one,
    // resulting in multiple setting buttons. Use .first() to avoid strict mode violation.
    const settingBtn = page.getByRole('button', { name: 'setting' });

    for (let safety = 0; safety < 5; safety++) {
      if (!await settingBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) break;

      await settingBtn.first().click();
      await page.waitForTimeout(300);
      await page.getByRole('menuitem', { name: 'delete delete' }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(1000);
    }

    // Verify all stand-ups are deleted
    await expect(settingBtn).toHaveCount(0, { timeout: 5000 });
  });

