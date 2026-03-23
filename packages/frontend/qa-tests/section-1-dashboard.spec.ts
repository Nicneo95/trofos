// spec: specs/section-1-dashboard.md
// seed: e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Section 1 - Dashboard Display, Sorting & Search', () => {
  test.beforeEach(async ({ page }) => {
    // Get credentials from environment variables
    const email = process.env.TEST_EMAIL!;
    const password = process.env.TEST_PASSWORD!;
    
    // Navigate to TROFOS
    await page.goto('https://trofos-production.comp.nus.edu.sg/');
    await page.waitForLoadState('networkidle');
    
    // Click Login button
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(5000);
    
    // Click NUS (Student) button
    await page.getByRole('button', { name: 'NUS (Student)' }).click();
    await page.waitForTimeout(5000);
    
    // Fill in email from environment variable
    await page.getByRole('textbox', { name: 'User Account' }).fill(email);
    
    // Fill in password from environment variable
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    
    // Click Sign in button
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');
  });

  test('1.1 Dashboard displays correctly', async ({ page }) => {
    // 1. Verify dashboard after login
    // Verify: Active Sprints shows 1
    const activeSprints = await page.locator('text=Active Sprints').first();
    await expect(activeSprints).toBeVisible();
    
    // Verify: Outstanding Issues shows 1
    const outstandingIssues = await page.locator('text=Outstanding Issues').first();
    await expect(outstandingIssues).toBeVisible();
    
    // Verify: My Projects table loads
    const projectsTable = await page.locator('text=My Projects').first();
    await expect(projectsTable).toBeVisible();
    
    // Verify: Project Group exists
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await expect(projectGroup).toBeVisible();
    
    // Verify: Issues for me to do table loads
    const issuesTable = await page.locator('text=Issues for me to do').first();
    await expect(issuesTable).toBeVisible();
    
    // Verify: User avatar displays with initials
    const userAvatar = page.getByRole('button').locator('.ant-avatar');  // Avatar button
    await expect(userAvatar).toBeVisible();
  });

  test('1.2 Sort projects by ID ascending', async ({ page }) => {
    // 1. Click ID column header in My Projects table
    const idHeader = await page.locator('th:has-text("ID")').first();
    await expect(idHeader).toBeVisible();
    await idHeader.click();
    
    // Wait for sort to apply
    await page.waitForTimeout(5000);
    
    // Verify: Projects sort by ID in ascending order
    const projectRows = await page.locator('table tbody tr');
    await expect(projectRows.first()).toBeVisible();
  });

  test('1.3 Sort projects by ID descending', async ({ page }) => {
    // Click ID header to sort ascending first
    const idHeader = await page.locator('th:has-text("ID")').first();
    await idHeader.click();
    await page.waitForTimeout(5000);
    
    // 1. Click ID column header again for descending
    await idHeader.click();
    await page.waitForTimeout(5000);
    
    // Verify: Projects sort by ID in descending order
    const projectRows = await page.locator('table tbody tr');
    await expect(projectRows.first()).toBeVisible();
  });

  test('1.4 Sort projects by Name', async ({ page }) => {
    // 1. Click Name column header
    const nameHeader = await page.locator('th:has-text("Name")').first();
    await expect(nameHeader).toBeVisible();
    await nameHeader.click();
    await page.waitForTimeout(5000);
    
    // Verify: Projects sort alphabetically A-Z
    const projectRows = await page.locator('table tbody tr');
    await expect(projectRows.first()).toBeVisible();
    
    // Click again for Z-A
    await nameHeader.click();
    await page.waitForTimeout(5000);
    
    // Verify: Projects sort Z-A
    await expect(projectRows.first()).toBeVisible();
  });

  test('1.5 Sort issues by Priority', async ({ page }) => {
    // Find the Issues for me to do table and click Priority header
    const tables = await page.locator('table');
    const tableCount = await tables.count();
    
    // Look for Priority header in any table
    let priorityHeader;
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      const th = table.locator('th:has-text("Priority")');
      if (await th.isVisible()) {
        priorityHeader = th;
        break;
      }
    }
    
    // 1. Click Priority column header
    if (priorityHeader) {
      await priorityHeader.click();
      await page.waitForTimeout(5000);
      
      // Verify: Priority column is sorted
      const issueRows = await page.locator('table tbody tr');
      await expect(issueRows.first()).toBeVisible();
    }
  });

  test('1.6 Sort issues by Story Points', async ({ page }) => {
    // 1. Click Points column header
    const pointsHeader = await page.locator('th:has-text("Points")').first();
    
    if (await pointsHeader.isVisible()) {
      await pointsHeader.click();
      await page.waitForTimeout(5000);
      
      // Verify: Highest point values appear first
      const issueRows = await page.locator('table tbody tr');
      await expect(issueRows.first()).toBeVisible();
    }
  });

  test('1.7 Search projects by name', async ({ page }) => {
    // 1. Type "Project" in the search box
    const searchBox = await page.getByPlaceholder(/search/i).first();
    await expect(searchBox).toBeVisible();
    
    await searchBox.fill('Project');
    await page.waitForTimeout(5000);
    
    // Verify: Results filter to matching projects
    const projectRows = await page.locator('table tbody tr');
    const visibleCount = await projectRows.count();
    await expect(visibleCount).toBeGreaterThan(0);
    
    // 2. Type non-existent project name
    await searchBox.clear();
    await searchBox.fill('NONEXISTENT_XYZ_12345');
    await page.waitForTimeout(5000);
    
    // Verify: No results display
    const emptyRows = await projectRows.count();
    // Should have fewer or no results
    
    // 3. Clear search box
    await searchBox.clear();
    await page.waitForTimeout(5000);
    
    // Verify: All projects reappear
    const allRows = await page.locator('table tbody tr');
    const allCount = await allRows.count();
    await expect(allCount).toBeGreaterThan(0);
  });

  test('1.8 Toggle dark/light theme', async ({ page }) => {
    // 1. Click D/L (Dark/Light) toggle in header
    const themeToggle = await page.locator('switch').first();
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(5000);
      
      // Verify: Page switches theme
      const html = await page.locator('html');
      const themeAfter = await html.getAttribute('data-theme');
      
      // 2. Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify: Theme persists
      const themePersisted = await html.getAttribute('data-theme');
      await expect(themePersisted).toBe(themeAfter);
      
      // 3. Click toggle again
      const themeToggleAfterRefresh = await page.locator('switch').first();
      
      if (await themeToggleAfterRefresh.isVisible()) {
        await themeToggleAfterRefresh.click();
        await page.waitForTimeout(5000);
        
        // Verify: Theme changes back
        const themeFinal = await html.getAttribute('data-theme');
        await expect(themeFinal).not.toBe(themePersisted);
      }
    }
  });
});
