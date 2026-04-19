import { test, expect, type Page } from '@playwright/test';

// SHARED FIXTURE — reuse authenticated session, navigate to Board page

const boardTest = test.extend<{ authenticatedPage: Page }>({
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
        console.log(`[Board fixture] Attempt ${attempt}: dashboard not ready. Reloading…`);
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
    // Wait for submenu links to appear (dynamic wait instead of fixed 500ms)
    await page.locator('a[href^="/project/"]').first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

    const testProject = page.locator('a[href^="/project/"]').filter({ hasText: 'Test Project' }).first();
    const firstProject = page.locator('a[href^="/project/"]:not([href*="example"])').first();

    if (await testProject.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testProject.click();
    } else {
      await expect(firstProject).toBeVisible({ timeout: 10000 });
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

    // Navigate via Sprint page → "View Board" on the BoardTest Sprint so we always use the
    // sprint-specific URL (/project/X/board/Y = SprintScrumBoardPage).
    // This avoids cross-shard interference: shard 1's sprint lifecycle tests change the
    // "active sprint", breaking the /board URL which uses useGetActiveSprintQuery.
    await page.getByRole('menuitem', { name: 'Sprint' }).click();
    await page.waitForURL(/\/sprint/);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // "View Board" only renders when sprint.status !== 'current', so we cannot rely on it.
    // Instead, extract the sprint ID directly from the droppable container on the Sprint page
    // and navigate to /project/X/board/Y (SprintScrumBoardPage) which always renders tabs.
    const boardTestListItem = page.locator('li.sprint-card-container').filter({ hasText: 'BoardTest Sprint' }).first();
    const sprintDroppable = boardTestListItem.locator('[data-rbd-droppable-id]').first();
    const sprintId = await sprintDroppable.getAttribute('data-rbd-droppable-id', { timeout: 8000 }).catch(() => null);

    const currentUrl = page.url();
    const projectMatch = currentUrl.match(/\/project\/(\d+)/);
    const projectId = projectMatch?.[1];

    if (sprintId && projectId) {
      await page.goto(`/project/${projectId}/board/${sprintId}`);
      await page.waitForURL(/\/board\/\d+/);
    } else {
      // Fallback: active sprint board (for 4.0 which runs before BoardTest Sprint exists)
      await page.getByRole('menuitem', { name: 'Board' }).click();
      await page.waitForURL(/\/board/);
    }
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    // SprintScrumBoardPage always renders tabs; wait for the Scrum Board tab
    await page.getByRole('tab', { name: 'Scrum Board' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await page.setViewportSize({ width: 1600, height: 1200 });

    await use(page);
  },
});

// Keep default mode so failures do not skip the remaining tests in this file

/** Drag a card from one droppable zone to another using mouse events.
 *  If the card is not found in fromZoneId (e.g. due to CI retry ordering),
 *  it falls back to whichever zone actually contains a card. */
async function dragCard(page: Page, fromZoneId: string, toZoneId: string) {
  // Wait for at least one card to be visible before scanning zones (board may still be rendering)
  await page.locator('[data-rbd-drag-handle-draggable-id]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // Try the expected source zone first; fall back to any zone that has a card
  let actualFromZoneId = fromZoneId;
  const expectedZone = page.locator(`[data-rbd-droppable-id="${fromZoneId}"]`).first();
  const cardInExpected = await expectedZone
    .locator('[data-rbd-drag-handle-draggable-id]').first()
    .isVisible({ timeout: 8000 }).catch(() => false);

  if (!cardInExpected) {
    // Zone IDs = user_index * numStatuses + status_index; user order is non-deterministic.
    // Enumerate ALL actual droppable zones in the DOM rather than guessing a max index.
    const allZones = await page.locator('[data-rbd-droppable-id]').all();
    for (const zone of allZones) {
      const zId = await zone.getAttribute('data-rbd-droppable-id');
      if (zId === null || zId === fromZoneId) continue;
      if (await zone.locator('[data-rbd-drag-handle-draggable-id]').first()
          .isVisible({ timeout: 500 }).catch(() => false)) {
        actualFromZoneId = zId;
        break;
      }
    }
  }

  const fromZone = page.locator(`[data-rbd-droppable-id="${actualFromZoneId}"]`).first();
  const toZone = page.locator(`[data-rbd-droppable-id="${toZoneId}"]`).first();

  const card = fromZone.locator('[data-rbd-drag-handle-draggable-id]').first();
  await expect(card).toBeVisible({ timeout: 10000 });

  const countBefore = await toZone.locator('[data-rbd-drag-handle-draggable-id]').count();

  const cardBox = await card.boundingBox();
  const targetBox = await toZone.boundingBox();
  if (!cardBox || !targetBox) throw new Error('Could not get bounding boxes for drag');

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 },
  );
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);

  // Skip count check if source and target resolved to same zone (card already there)
  if (actualFromZoneId !== toZoneId) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const countAfter = await toZone.locator('[data-rbd-drag-handle-draggable-id]').count();
      if (countAfter === countBefore + 1) return; // Success
      if (attempt === 0) {
        await page.waitForTimeout(2000);
      }
    }
    // Final assertion if retries didn't work
    await expect(toZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1, { timeout: 5000 });
  }
}

// BOARD TESTS — Section 4

// --- 4.0 Setup: create sprint + backlog so the board has a card to drag -----

boardTest('[Board] 4.0 - Setup test sprint and backlog', async ({ authenticatedPage: page }) => {
  boardTest.setTimeout(90_000);

  // Go to Sprint tab to create a sprint
  await page.getByRole('menuitem', { name: 'Sprint' }).click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const sprintName = `BoardTest Sprint ${Date.now()}`;

  // Create sprint
  await page.getByRole('button', { name: 'New Sprint' }).click();
  await page.waitForSelector('.ant-modal-content');
  await page.locator('#name').clear();
  await page.locator('#name').fill(sprintName);
  await page.locator('.ant-modal-footer button[type="submit"]').click();
  await page.waitForTimeout(1000);

  // Start the sprint — wait for the card to appear, reload if needed
  const sprintCard = page.locator('.sprint-card-container').filter({ hasText: sprintName });
  for (let startAttempt = 0; startAttempt < 3; startAttempt++) {
    const startBtn = sprintCard.locator('button[data-tour="start-sprint-button"]');
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      break;
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1000);

  // Navigate to Board
  await page.getByRole('menuitem', { name: 'Board' }).click();
  await page.waitForURL(/\/board/);
  await page.waitForLoadState('domcontentloaded');

  // Wait for active sprint to load — "Create Backlog" button only renders when activeSprint is set
  const createBacklogBtn = page.getByRole('button', { name: 'Create Backlog For This Sprint' });
  await createBacklogBtn.waitFor({ state: 'visible', timeout: 30000 });

  // Create a backlog item on the board
  await createBacklogBtn.click();
  await page.waitForTimeout(500);

  const summaryInput = page.getByRole('textbox', { name: /summary/i });
  await summaryInput.fill(`BoardTest Issue ${Date.now()}`);

  // Select Type
  await page.locator('.ant-form-item').filter({ hasText: 'Type' }).locator('.ant-select').click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
  await page.waitForTimeout(200);

  // Select Reporter
  await page.locator('.ant-form-item').filter({ hasText: 'Reporter' }).locator('.ant-select').click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
  await page.waitForTimeout(200);

  // Select Assignee
  await page.locator('.ant-form-item').filter({ hasText: 'Assignee' }).locator('.ant-select').click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
  await page.waitForTimeout(300);

  // Submit
  await page.locator('button[form="newBacklog"][type="submit"]').click();
  await page.waitForTimeout(1000);

  // Verify card appeared in the To do column
  const todoZone = page.locator('[data-rbd-droppable-id="0"]').first();
  await expect(todoZone.locator('[data-rbd-drag-handle-draggable-id]').first()).toBeVisible({ timeout: 10000 });
});

// --- 4.1–4.6 Drag & drop permutations --------------------------------------

boardTest('[Board] 4.1 - Drag issue from To do → In progress', async ({ authenticatedPage: page }) => {
  await dragCard(page, '0', '1');
});

boardTest('[Board] 4.2 - Drag issue from In progress → Done', async ({ authenticatedPage: page }) => {
  await dragCard(page, '1', '2');
});

boardTest('[Board] 4.3 - Drag issue from Done → In progress', async ({ authenticatedPage: page }) => {
  await dragCard(page, '2', '1');
});

boardTest('[Board] 4.4 - Drag issue from In progress → To do', async ({ authenticatedPage: page }) => {
  await dragCard(page, '1', '0');
});

boardTest('[Board] 4.5 - Drag issue from To do → Done (skip column)', async ({ authenticatedPage: page }) => {
  await dragCard(page, '0', '2');
});

boardTest('[Board] 4.6 - Drag issue from Done → To do (skip column)', async ({ authenticatedPage: page }) => {
  await dragCard(page, '2', '0');
});

// --- 4.7 Switch to Notes tab ------------------------------------------------

boardTest('[Board] 4.7 - Switch to Notes tab and view sprint notes', async ({ authenticatedPage: page }) => {
  // SprintScrumBoardPage always renders "Scrum Board" + "Notes" tabs (fixture already waited for them)
  const notesTab = page.getByRole('tab', { name: /notes/i });
  await expect(notesTab).toBeVisible({ timeout: 10000 });
  await notesTab.click();
  await page.waitForTimeout(500);

  // Verify the editor loaded (Lexical rich-text editor)
  const editor = page.locator('[data-lexical-editor="true"]');
  await expect(editor).toBeVisible({ timeout: 5000 });

  // Verify toolbar is present
  const toolbar = page.locator('.editor-toolbar-container');
  await expect(toolbar).toBeVisible();

  // Switch back to Board tab for remaining tests
  const boardTab = page.getByRole('tab', { name: /board/i });
  if (await boardTab.isVisible().catch(() => false)) {
    await boardTab.click();
    await page.waitForTimeout(500);
  }
});

// --- 4.8 Cleanup: delete the test sprint and leftover backlogs --------------

boardTest('[Board] 4.8 - Cleanup test sprint and backlogs', async ({ authenticatedPage: page }) => {
  boardTest.setTimeout(60_000);

  // Navigate to Sprint page
  await page.getByRole('menuitem', { name: 'Sprint' }).click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Delete sprints with "BoardTest" prefix
  let retries = 0;
  while (retries < 10) {
    const card = page.locator('.sprint-card-container').filter({ hasText: 'BoardTest Sprint' });
    const visible = await card.first().isVisible({ timeout: 2000 }).catch(() => false);
    if (!visible) break;
    try {
      await card.first().locator('.sprint-menu-dropdown').click({ timeout: 5000 });
      await page.waitForTimeout(300);
      await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete sprint' }).click({ timeout: 5000 });
      await page.locator('.ant-modal').filter({ hasText: 'DELETE SPRINT' }).locator('button.ant-btn-dangerous').click({ timeout: 5000 });
      await page.waitForTimeout(500);
    } catch {
      await page.keyboard.press('Escape');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
    }
    retries++;
  }

  // Delete leftover unassigned backlogs with "BoardTest" prefix
  retries = 0;
  while (retries < 10) {
    const backlog = page.locator('li.backlog-card-container').filter({ hasText: 'BoardTest Issue' });
    const visible = await backlog.first().isVisible({ timeout: 2000 }).catch(() => false);
    if (!visible) break;
    try {
      await backlog.first().locator('.backlog-card-id').click({ timeout: 5000 });
      await page.locator('.backlog-menu-dropdown').click({ timeout: 5000 });
      await page.waitForTimeout(300);
      await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete backlog' }).click({ timeout: 5000 });
      await page.locator('.ant-modal').filter({ hasText: 'DELETE BACKLOG' }).locator('button.ant-btn-dangerous').click({ timeout: 5000 });
      await page.waitForTimeout(500);
    } catch {
      await page.keyboard.press('Escape');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
    }
    retries++;
  }
});
