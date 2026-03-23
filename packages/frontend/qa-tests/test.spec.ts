import { test, expect } from '@playwright/test';

const sprintName = `Test Sprint ${Date.now()}`;
const issueTitle = `Test Issue ${Date.now()}`;
const epicTitle = `Epic ${Date.now()}`;
const backlogsTitle = `Backlog ${Date.now()}`;

test.describe('Section 3 - Sprint page', () => {

  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_EMAIL!;
    const password = process.env.TEST_PASSWORD!;

    await page.goto('https://trofos-production.comp.nus.edu.sg/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'NUS (Student)' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('textbox', { name: 'User Account' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[role="menu"]');
    await page.getByRole('menu').locator('span').filter({ hasText: /^Project$/ }).click();
    await page.waitForSelector('[role="menuitem"]:has-text("Test Project")');
    await page.getByRole('menuitem', { name: 'Test Project' }).getByRole('link').click();

    await page.waitForURL('**/project/**');
    const url = page.url();
    const projectId = url.match(/project\/(\d+)/)?.[1];

    await page.goto(`https://trofos-production.comp.nus.edu.sg/project/${projectId}/sprint`);
    await page.waitForLoadState('networkidle');
  });


  // ─── 1. Sprint Creation and Management ───────────────────────────────────────

  test('1.1 Create new sprint with valid details', async ({ page }) => {
    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#name').clear();
    await page.locator('#name').fill(sprintName);

    await expect(page.locator('#duration')).toBeVisible();

    await page.locator('#startDate').fill('2026-10-03');

    await page.locator('form#newSprint textarea#goals').fill('Complete critical features');

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.sprint-card-name', { hasText: sprintName })).toBeVisible({ timeout: 5000 });
  });

  test('1.2 Edit existing sprint details', async ({ page }) => {
    await page.locator('.sprint-card-inner-container').first().getByRole('img', { name:'setting' }).click();

    await page.waitForTimeout(300);
    await page.getByRole('menuitem', { name: 'Edit sprint' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#goals').clear();
    await page.locator('#goals').fill('Updated goals for testing');

    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ant-modal-content')).not.toBeVisible();
  });

  test('1.3 Sprint name required validation', async ({ page }) => {
    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#name').clear();

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    await expect(page.locator('.ant-modal-content')).toBeVisible();
  });

  // ─── 2. Sprint Lifecycle ──────────────────────────────────────────────────────

  test('2.1 Start an upcoming sprint', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Sprint' }).nth(1).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: 'Complete Sprint', exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('2.2 Complete a current sprint', async ({ page }) => {
    const activeSprintName = await page.locator('.sprint-card-name').first().innerText();
    await page.getByRole('button', { name: 'Complete Sprint', exact: true }).click();
    await page.waitForTimeout(500);
    // Verify it appears in completed sprints with Retrospective button
    await expect(
      page.locator('.sprint-card-inner-container')
        .filter({ hasText: activeSprintName })
        .locator('[data-tour="retrospective-tab"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('2.3 View retrospective for completed sprint', async ({ page }) => {
    await page.getByRole('button', { name: 'Retrospective' }).nth(1).click();
    await page.waitForURL(/\/sprint\/\d+\/retrospective/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/sprint\/\d+\/retrospective/);
  });


  // ─── 3. Sprint Issue Management ──────────────────────────────────────────────
  // Creates a fresh backlog item and sprint, then tests issue operations on it
  
  test('3.0 Setup - create sprint and backlog for issue tests', async ({ page }) => {
    // Create sprint for issue tests
    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#name').clear();
    await page.locator('#name').fill(`Issue Sprint ${Date.now()}`);

    await expect(page.locator('#duration')).toBeVisible();;

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Create backlog item
    await page.getByRole('button', { name: 'New Backlog' }).click();
    //await page.waitForSelector('.ant-modal-content');

    await page.locator('.summary-input').fill(issueTitle);

    await page.locator('.ant-form-item').filter({ hasText: 'Type' }).locator('.ant-select').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.locator('.ant-form-item').filter({ hasText: 'Reporter' }).locator('.ant-select').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForTimeout(500);

    await expect(page.locator('.backlog-card-summary', { hasText: issueTitle })).toBeVisible({ timeout: 5000 });
  });

  test('3.1 View issues in expanded sprint', async ({ page }) => {
    const issueCards = page.locator('.backlog-card-container');
    await expect(issueCards.first()).toBeVisible({ timeout: 5000 });
    expect(await issueCards.count()).toBeGreaterThanOrEqual(1);
  });

  test('3.2 Change issue status within sprint', async ({ page }) => {
    const issueCard = page.locator('.backlog-card-container').filter({ hasText: issueTitle });
    await issueCard.locator('.backlog-card-status').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible').getByTitle('In progress').click();
    await page.waitForTimeout(300);

    await expect(issueCard.locator('.backlog-card-status .ant-select-selection-item')).toHaveText('In progress');
  });

    test('3.4 Update story points for issue', async ({ page }) => {
    const issueCard = page.locator('.backlog-card-container').filter({ hasText: issueTitle });
    const pointsInput = issueCard.locator('.ant-input-number-input');

    await pointsInput.click();
    await pointsInput.press('ControlOrMeta+a');
    await pointsInput.fill('8');
    await pointsInput.press('Tab');
    await page.waitForTimeout(300);

    await expect(pointsInput).toHaveValue('8');
  });


  // ─── 4. Board Navigation ─────────────────────────────────────────────────────

  test('4.1 Navigate between sprint and board tabs', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Board' }).click();
    await expect(page).toHaveURL(/\/board/);

    await page.getByRole('menuitem', { name: 'Sprint' }).click();
    await expect(page).toHaveURL(/\/sprint/);
  });


  // ─── 5. Backlog and Epic Management ──────────────────────────────────────────
  
  test('5.1 Create new backlog', async ({ page }) => {
    await page.getByRole('button', { name: 'New Backlog' }).click();

    await page.locator('.summary-input').fill(backlogsTitle);

    await page.locator('.ant-form-item').filter({ hasText: 'Type' }).locator('.ant-select').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.locator('.ant-form-item').filter({ hasText: 'Reporter' }).locator('.ant-select').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForTimeout(500);

    await expect(page.locator('.backlog-card-summary', { hasText: backlogsTitle })).toBeVisible({ timeout: 5000 });
  });

  test('5.2 Create new epic', async ({ page }) => {
    await page.getByRole('button', { name: 'New Epic' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#name').fill(epicTitle);
    await page.locator('#description').fill('Test epic description');

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ant-modal-content')).not.toBeVisible();
    await expect(page.locator('.epic-card-name', { hasText: epicTitle })).toBeVisible({ timeout: 5000 });
  });

  test('5.3 Delete backlog entry', async ({ page }) => {
    await page.locator('li.backlog-card-container', { hasText: backlogsTitle }).locator('.backlog-card-id').click();  
    await page.locator('.backlog-menu-dropdown').click();

    await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete backlog' }).click();

    await page.locator('.ant-modal').filter({ hasText: 'DELETE BACKLOG' }).locator('button.ant-btn-dangerous').click();

    await page.waitForTimeout(500);

    await expect(page.locator('.backlog-card-summary', { hasText: backlogsTitle })).not.toBeVisible({ timeout: 5000 });
  });

  test('5.4 Delete epic', async ({ page }) => {
  await page.locator('li.epic-card-container')
    .filter({ hasText: epicTitle })
    .locator('.epic-menu-dropdown')
    .click();


    await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete epic' }).click();

    await page.locator('.ant-modal').filter({ hasText: 'DELETE SPRINT' }).locator('button.ant-btn-dangerous').click();

    await page.waitForTimeout(500);

    await expect(page.locator('li.epic-card-container').filter({ hasText: epicTitle })).not.toBeVisible({ timeout: 5000 });

  });


  // ─── 6. Sprint Deletion ───────────────────────────────────────────────────────

  test('6.1 Delete sprint with confirmation', async ({ page }) => {
    const deleteSprintName = `To Delete Sprint ${Date.now()}`;
    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');
    await page.locator('#name').fill(deleteSprintName);

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    await page.locator('.sprint-card-inner-container')
      .filter({ hasText: deleteSprintName })
      .getByRole('img', { name: 'setting' })
      .click();

    await page.getByRole('menuitem', { name: 'Delete sprint' }).click();
    await page.locator('.ant-modal').filter({ hasText: 'DELETE SPRINT' }).getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.sprint-card-name', { hasText: deleteSprintName })).not.toBeVisible();
  });

  test('6.2 Cancel sprint deletion', async ({ page }) => {
    //Create sprint
    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');
    await page.locator('#name').fill(sprintName);
    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    await page.locator('.sprint-card-inner-container')
      .filter({ hasText: sprintName })
      .getByRole('img', { name: 'setting' })
      .click();

    await page.getByRole('menuitem', { name: 'Delete sprint' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('.sprint-card-name', { hasText: sprintName })).toBeVisible();
  });


  // ─── 7. Search ────────────────────────────────────────────────────────────────

  test('7.1 Search for sprint by name', async ({ page }) => {

    await page.getByRole('combobox', { name: 'type to search' }).fill(sprintName);
    await page.waitForTimeout(500);

    await expect(page.locator('.sprint-card-name', { hasText: sprintName })).toBeVisible();

    await page.getByRole('combobox', { name: 'type to search' }).clear();
    await page.waitForTimeout(500);
  });


  // ─── 8. UI Features ──────────────────────────────────────────────────────────

  test('8.1 Toggle dark and light theme', async ({ page }) => {
    const toggle = page.getByRole('switch');
    await toggle.click();
    await page.waitForTimeout(300);
    await toggle.click();
    await page.waitForTimeout(300);

    await expect(page).toHaveURL(/\/sprint/);
  });

  // ─── 9. Edge Cases ────────────────────────────────────────────────────────────

  test('9.1 Create sprint with very long name', async ({ page }) => {
    const longName = 'A'.repeat(150);

    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#name').clear();
    await page.locator('#name').fill(longName);

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    const modalVisible = await page.locator('.ant-modal-content').isVisible();
    if (!modalVisible) {
      await expect(page.locator('.sprint-card-name').first()).toBeVisible();
    } else {
      await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    }
  });

  test('9.2 Create sprint with past start date', async ({ page }) => {
    await page.getByRole('button', { name: 'New Sprint' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#name').fill('Past Date ' + sprintName);

    await page.locator('#startDate').fill('2020-01-01');

    await page.locator('.ant-modal-footer button[type="submit"]').click();
    await page.waitForTimeout(500);

    const hasError = await page.locator('.ant-form-item-explain-error').isVisible();
    const modalClosed = !(await page.locator('.ant-modal-content').isVisible());
    expect(hasError || modalClosed).toBeTruthy();
  });

  // ─── 10. Navigation ───────────────────────────────────────────────────────────

  test('10.1 Navigate to project overview from sprint page', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/\/overview/);
  });

  test('10.2 Verify project context is maintained', async ({ page }) => {
    await expect(page.locator('text=Project Group 10')).toBeVisible();
  });

  // ─── 11. Cleanup ───────────────────────────────────────────────────────────

  //upcoming sprints
  test('11.1 Cleanup upcoming sprints', async ({ page }) => {
    test.setTimeout(120_000);
    const upcomingSection = page.locator('.sprint-list').filter({ hasText: 'Upcoming Sprints' });

    while (await upcomingSection.locator('.sprint-card-container').first().isVisible()) {
      await upcomingSection.locator('.sprint-menu-dropdown').first().click();
      await page.waitForTimeout(300);

      await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete sprint' }).click();

      await page.locator('.ant-modal').filter({ hasText: 'DELETE SPRINT' }).locator('button.ant-btn-dangerous').click();
      await page.waitForTimeout(500);
    }

    await expect(upcomingSection.locator('.sprint-card-container').first()).not.toBeVisible({ timeout: 5000 });
  });

  test('11.2 Cleanup unassigned backlog items', async ({ page }) => {
    test.setTimeout(120_000);

    const unassignedSection = page.locator('.sprint-list').filter({ hasText: 'Unassigned Backlogs' });

    while (await unassignedSection.locator('li.backlog-card-container').first().isVisible()) {
      await unassignedSection.locator('.backlog-card-id').first().click();
      await page.locator('.backlog-menu-dropdown').click()
      await page.waitForTimeout(300);

      await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete backlog' }).click();

      await page.locator('.ant-modal').filter({ hasText: 'DELETE BACKLOG' }).locator('button.ant-btn-dangerous').click();
      await page.waitForTimeout(500);
    }

    await expect(unassignedSection.locator('li.backlog-card-container').first()).not.toBeVisible({ timeout: 5000 });
  });



  //completed sprints
  test('11.3 Cleanup completed sprints', async ({ page }) => {
    test.setTimeout(120_000);
    const completedSection = page.locator('.sprint-list').filter({ hasText: 'Completed Sprints' });

    while (await completedSection.locator('.sprint-card-container').first().isVisible()) {
      await completedSection.locator('.sprint-menu-dropdown').first().click();
      await page.waitForTimeout(300);

      await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete sprint' }).click();

      await page.locator('.ant-modal').filter({ hasText: 'DELETE SPRINT' }).locator('button.ant-btn-dangerous').click();
      await page.waitForTimeout(500);
    }

    await expect(completedSection.locator('.sprint-card-container').first()).not.toBeVisible({ timeout: 5000 });
  });

  //epics
  test('11.4 Cleanup epics', async ({ page }) => {
    test.setTimeout(120_000);

    const epicSection = page.locator('.epic-list').filter({ hasText: 'Epics' });

    while (await epicSection.locator('li.epic-card-container').first().isVisible()) {
      await epicSection.locator('.epic-menu-dropdown').first().click();
      await page.waitForTimeout(300);

      await page.locator('.ant-dropdown-menu-item-danger', { hasText: 'Delete epic' }).click();

      await page.locator('.ant-modal').filter({ hasText: 'DELETE SPRINT' }).locator('button.ant-btn-dangerous').click();
      await page.waitForTimeout(500);
    }

    await expect(epicSection.locator('li.epic-card-container').first()).not.toBeVisible({ timeout: 5000 });
  });

});
