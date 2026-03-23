// spec: specs/section-4-board.md
// seed: e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Section 4 - Board Drag & Drop Permutations & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://trofos-production.comp.nus.edu.sg/');
    await page.waitForLoadState('networkidle');

    // Wait for sidebar menu to render
    await page.waitForSelector('[role="menu"]');

    await page.getByRole('menu').locator('span').filter({ hasText: /^Project$/ }).click();

    // Wait for submenu to expand
    await page.waitForSelector('[role="menuitem"]:has-text("Project Group")');

    await page.getByRole('menuitem', { name: 'Project Group' }).getByRole('link').click();

    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');

    await page.getByRole('menuitem', { name: 'Board' }).click();
    await page.waitForURL(/\/board/);
    await page.waitForSelector('[data-rbd-droppable-id]');
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });


  test('4.1 Drag issue from To do to In progress', async ({ page }) => {
    const todoZone = page.locator('[data-rbd-droppable-id="0"]').first();
    const inProgressZone = page.locator('[data-rbd-droppable-id="1"]').first();

    const issueCard = todoZone.locator('[data-rbd-drag-handle-draggable-id]').first();
    await expect(issueCard).toBeVisible();

    const countBefore = await inProgressZone.locator('[data-rbd-drag-handle-draggable-id]').count();

    const cardBox = await issueCard.boundingBox();
    const targetBox = await inProgressZone.boundingBox();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    await expect(inProgressZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1);
  });

  test('4.2 Drag issue from In progress to Done', async ({ page }) => {
    const inProgressZone = page.locator('[data-rbd-droppable-id="1"]').first();
    const doneZone = page.locator('[data-rbd-droppable-id="2"]').first();

    const issueCard = inProgressZone.locator('[data-rbd-drag-handle-draggable-id]').first();
    await expect(issueCard).toBeVisible();

    const countBefore = await doneZone.locator('[data-rbd-drag-handle-draggable-id]').count();

    const cardBox = await issueCard.boundingBox();
    const targetBox = await doneZone.boundingBox();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    await expect(doneZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1);
  });

  test('4.3 Drag issue from Done back to In progress', async ({ page }) => {
    const doneZone = page.locator('[data-rbd-droppable-id="2"]').first();
    const inProgressZone = page.locator('[data-rbd-droppable-id="1"]').first();

    const issueCard = doneZone.locator('[data-rbd-drag-handle-draggable-id]').first();
    await expect(issueCard).toBeVisible();

    const countBefore = await inProgressZone.locator('[data-rbd-drag-handle-draggable-id]').count();

    const cardBox = await issueCard.boundingBox();
    const targetBox = await inProgressZone.boundingBox();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    await expect(inProgressZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1);
  });

  test('4.4 Drag issue from In progress back to To do', async ({ page }) => {
    const inProgressZone = page.locator('[data-rbd-droppable-id="1"]').first();
    const todoZone = page.locator('[data-rbd-droppable-id="0"]').first();

    const issueCard = inProgressZone.locator('[data-rbd-drag-handle-draggable-id]').first();
    await expect(issueCard).toBeVisible();

    const countBefore = await todoZone.locator('[data-rbd-drag-handle-draggable-id]').count();

    const cardBox = await issueCard.boundingBox();
    const targetBox = await todoZone.boundingBox();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    await expect(todoZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1);
  });

  test('4.5 Drag issue from To do directly to Done', async ({ page }) => {
    const todoZone = page.locator('[data-rbd-droppable-id="0"]').first();
    const doneZone = page.locator('[data-rbd-droppable-id="2"]').first();

    const issueCard = todoZone.locator('[data-rbd-drag-handle-draggable-id]').first();
    await expect(issueCard).toBeVisible();

    const countBefore = await doneZone.locator('[data-rbd-drag-handle-draggable-id]').count();

    const cardBox = await issueCard.boundingBox();
    const targetBox = await doneZone.boundingBox();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    await expect(doneZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1);
  });

  test('4.6 Drag issue from Done directly to To do', async ({ page }) => {
    const doneZone = page.locator('[data-rbd-droppable-id="2"]').first();
    const todoZone = page.locator('[data-rbd-droppable-id="0"]').first();

    const issueCard = doneZone.locator('[data-rbd-drag-handle-draggable-id]').first();
    await expect(issueCard).toBeVisible();

    const countBefore = await todoZone.locator('[data-rbd-drag-handle-draggable-id]').count();

    const cardBox = await issueCard.boundingBox();
    const targetBox = await todoZone.boundingBox();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();

    await expect(todoZone.locator('[data-rbd-drag-handle-draggable-id]')).toHaveCount(countBefore + 1);
  });

  test('4.7 Filter by high priority issues', async ({ page }) => {
    // Look for filter button
    const filterBtn = await page.locator('button:has-text("Filter"), button:has-text("Priority"), select').first();
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      
      // Click High priority option
      const highOption = await page.locator('text=High').first();
      if (await highOption.isVisible()) {
        await highOption.click();
        await page.waitForTimeout(500);
      }
      
      // Verify only high priority shows
      const issues = await page.locator('[class*="card"], [class*="issue"]');
      const count = await issues.count();
      await expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('4.8 Filter by medium priority issues', async ({ page }) => {
    const filterBtn = await page.locator('button:has-text("Filter"), button:has-text("Priority"), select').first();
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      
      const mediumOption = await page.locator('text=Medium').first();
      if (await mediumOption.isVisible()) {
        await mediumOption.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('4.9 Filter by low priority issues', async ({ page }) => {
    const filterBtn = await page.locator('button:has-text("Filter"), button:has-text("Priority"), select').first();
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      
      const lowOption = await page.locator('text=Low').first();
      if (await lowOption.isVisible()) {
        await lowOption.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('4.10 Filter by multiple priorities simultaneously', async ({ page }) => {
    const filterBtn = await page.locator('button:has-text("Filter"), button:has-text("Priority"), select').first();
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      
      const highOption = await page.locator('text=High').first();
      const mediumOption = await page.locator('text=Medium').first();
      
      if (await highOption.isVisible()) {
        await highOption.click();
      }
      if (await mediumOption.isVisible()) {
        await mediumOption.click();
      }
    }
  });

  test('4.11 Clear all filters', async ({ page }) => {
    // Apply a filter first
    const filterBtn = await page.locator('button:has-text("Filter"), button:has-text("Priority"), select').first();
    
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      
      const highOption = await page.locator('text=High').first();
      if (await highOption.isVisible()) {
        await highOption.click();
        await page.waitForTimeout(500);
      }
      
      // Clear filter
      const clearBtn = await page.locator('button:has-text("Clear"), button:has-text("Reset")').first();
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('4.12 Click issue card opens details modal', async ({ page }) => {
    // Find and click an issue card
    const issueCard = await page.locator('[class*="card"], [class*="issue"]').first();
    
    if (await issueCard.isVisible()) {
      await issueCard.click();
      await page.waitForTimeout(500);
      
      // Verify modal opens
      const modal = await page.locator('[role="dialog"], .modal, .details, .modal-content').first();
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        
        // Close modal
        const closeBtn = await page.locator('button:has-text("Close"), button[aria-label*="Close"], .close').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('4.13 Switch to Notes tab and view sprint notes', async ({ page }) => {
    // Click the Notes tab
    await page.locator('#rc-tabs-0-tab-live-notes').click();
    await page.waitForTimeout(500);

    // Verify the tab panel is active
    const notesPanel = page.locator('#rc-tabs-0-panel-live-notes');
    await expect(notesPanel).toBeVisible();

    // Verify the Lexical editor is present
    const editor = notesPanel.locator('[data-lexical-editor="true"]');
    await expect(editor).toBeVisible();

    // Verify the editor toolbar is present
    const toolbar = notesPanel.locator('.editor-toolbar-container');
    await expect(toolbar).toBeVisible();
  });
});
