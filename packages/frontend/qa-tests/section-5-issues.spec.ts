// spec: specs/section-5-issues.md
// seed: e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Section 5 - Issues Create, Edit, Delete & Assign All Users', () => {
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
    
    // Wait for sidebar menu to render
    await page.waitForSelector('[role="menu"]');

    await page.getByRole('menu').locator('span').filter({ hasText: /^Project$/ }).click();

    // Wait for submenu to expand
    await page.waitForSelector('[role="menuitem"]:has-text("Project Group")');

    await page.getByRole('menuitem', { name: 'Project Group' }).getByRole('link').click();

    // After landing on project page, extract the project ID from URL
    await page.waitForURL('**/project/**');
    const url = page.url();
    const projectId = url.match(/project\/(\d+)/)?.[1];

    await page.goto(`https://trofos-production.comp.nus.edu.sg/project/${projectId}/issues`);
    await page.waitForLoadState('networkidle');
  });

  test('5.1 Create issue', async ({ page }) => {
    const issueTitle = 'Test Issue ' + Date.now();

    await page.getByRole('button', { name: 'Create Issue' }).click();
    await page.waitForSelector('.ant-modal-content');

    await page.locator('#issueForm_title').fill(issueTitle);

    await page.locator('#issueForm_assigneeProjectId').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.locator('#issueForm_type').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.locator('#issueForm_priority').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.locator('#issueForm_reporterId').click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(200);

    await page.locator('.ant-modal-footer').getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(`text=${issueTitle}`)).toBeVisible();
  });

  test('5.2 Add comment to issue', async ({ page }) => {
    const commentText = 'Test comment ' + Date.now();

    // Open issue detail
    await page.getByRole('button', { name: 'View' }).first().click();
    await page.waitForTimeout(500);

    // Fill and submit comment
    await page.getByRole('textbox', { name: 'Add new comment...' }).fill(commentText);
    await page.getByRole('button', { name: 'Add comment' }).click();
    await page.waitForTimeout(500);

    // Verify comment appears in the list
    await expect(page.locator('.ant-list-item-meta-description', { hasText: commentText })).toBeVisible();
  });


  test('5.3 Update comment on issue', async ({ page }) => {
    const updatedText = 'Updated comment ' + Date.now();

    // Open issue detail
    await page.getByRole('button', { name: 'View' }).first().click();
    await page.waitForTimeout(500);

    // Open comment context menu
    await page.locator('.anticon.anticon-menu').first().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    // Clear and fill updated comment
    await page.getByRole('textbox', { name: 'Update comment...' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Update comment...' }).fill(updatedText);

    // Submit update
    await page.getByRole('button', { name: 'Update' }).nth(1).click();
    await page.waitForTimeout(500);

    // Verify updated comment appears with (edited) marker
    await expect(page.locator('.ant-list-item-meta-description', { hasText: updatedText })).toBeVisible();
    await expect(page.locator('.comment-timestamp', { hasText: '(edited)' })).toBeVisible();
  });

  test('5.4 Delete comment on issue', async ({ page }) => {
    // Open issue detail
    await page.getByRole('button', { name: 'View' }).first().click();
    await page.waitForTimeout(500);

    // Open comment context menu and delete
    await page.locator('.anticon.anticon-menu').first().click();
    await page.getByText('Delete').click();

    // Confirm deletion in dialog
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(500);

    // Verify no comments remain
    await expect(page.locator('.ant-list-empty-text')).toBeVisible();
    await expect(page.locator('.ant-list-empty-text p')).toHaveText('No Comment');
  });

  test('5.5 Delete issue', async ({ page }) => {
    // Switch to "Assigned BY this project" tab
    await page.getByRole('tab', { name: 'Assigned BY this project' }).click();
    await page.waitForTimeout(500);

    // Count issues first
    let deleteButtons = await page.getByRole('button', { name: 'Delete' }).count();

    for (let i = 0; i < deleteButtons; i++) {
      await page.getByRole('button', { name: 'Delete' }).first().click();
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(500);
    }

    // Verify empty state
    await expect(
      page.getByRole('tabpanel', { name: 'Assigned BY this project' })
        .locator('.ant-table-placeholder')
    ).toBeVisible();
  });
});
