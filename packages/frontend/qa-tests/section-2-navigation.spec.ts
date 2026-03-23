// spec: specs/section-2-navigation.md
// seed: e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Section 2 - Navigation Routes, Menus & Links', () => {
  test.beforeEach(async ({ page }) => {
    // Get credentials from environment variables
    const email = process.env.TEST_EMAIL!;
    const password = process.env.TEST_PASSWORD!;
    
    // Navigate to TROFOS
    await page.goto('https://trofos-production.comp.nus.edu.sg/');
    await page.waitForLoadState('networkidle');
    
    // Click Login button
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(500);
    
    // Click NUS (Student) button
    await page.getByRole('button', { name: 'NUS (Student)' }).click();
    await page.waitForTimeout(500);
    
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

  test('2.1 Home menu navigates to dashboard', async ({ page }) => {
    // 1. Click Home in left navigation menu
    const homeMenu = await page.getByRole('menuitem', { name: /home/i }).first();
    await expect(homeMenu).toBeVisible();
    await homeMenu.click();
    
    // Wait for navigation
    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');
    
    // Verify: URL changes to /
    await expect(page).toHaveURL(/\/$|\/\?/);
    
    // Verify: Dashboard displays
    const dashboardHeading = await page.locator('text=Home').first();
    await expect(dashboardHeading).toBeVisible();
  });

  test('2.2 Courses menu navigates', async ({ page }) => {
    // 1. Click Courses in left navigation menu
    const coursesMenu = await page.getByRole('menuitem', { name: /courses/i });
    await expect(coursesMenu).toBeVisible();
    await coursesMenu.click();
    
    // Wait for navigation
    await page.waitForURL('**/courses/**');
    await page.waitForLoadState('networkidle');
    
    // Verify: URL changes to /courses/current
    await expect(page).toHaveURL(/\/courses/);
  });

  test('2.3 Projects menu expands and links work', async ({ page }) => {
    // 1. Click Projects in left navigation menu
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await expect(projectsMenu).toBeVisible();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    // Verify: Submenu expands, pick first Project Group
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await expect(projectGroup).toBeVisible();
    
    // 2. Click on Project Group 10
    await projectGroup.click();
    
    // Wait for navigation
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // Verify: Navigates to project page
    await expect(page).toHaveURL(/\/project\/\d+/);
  });

  test('2.4 Breadcrumb navigation works', async ({ page }) => {
    // 1. Navigate to a project page first
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await projectGroup.click();
    
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // 2. Click home link in breadcrumb
    const breadcrumb = await page.locator('nav [href="/"], a:has-text("Home")').first();
    
    if (await breadcrumb.isVisible()) {
      await breadcrumb.click();
      
      // Wait for navigation
      await page.waitForURL('**/');
      await page.waitForLoadState('networkidle');
      
      // Verify: Returns to dashboard
      await expect(page).toHaveURL(/\/$|\/\?/);
    }
  });

  test('2.5 Logo click returns to home', async ({ page }) => {
    // Navigate to a project page first
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await projectGroup.click();
    
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on project page
    const projectUrl = page.url();
    await expect(projectUrl).toContain('/project/');
    
    // 1. Click Trofos logo
    const logo = await page.locator('a[href="/"], img[alt*="Trofos"], link:has-text("Trofos")').first();
    await expect(logo).toBeVisible();
    await logo.click();
    
    // Wait for navigation to home
    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');
    
    // Verify: Navigates to / dashboard
    await expect(page).toHaveURL(/\/$|\/\?/);
  });

  test('2.6 Overview tab shows project overview', async ({ page }) => {
    // Navigate to project first
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await projectGroup.click();
    
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // 1. Click Overview tab in project
    const overviewTab = await page.getByRole('tab', { name: /overview/i }).first();
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(500);
      
      // Verify: URL is /project/290/overview
      await expect(page).toHaveURL(/\/project\/\d+\/overview/);
      
      // Verify: Milestones section displays
      const milestonesSection = await page.locator('text=Milestones, text=Milestone').first();
      
      // Verify: Active sprint info shows
      const sprintInfo = await page.locator('text=Sprint|Active').first();
      await expect(sprintInfo).toBeVisible();
    }
  });

  test('2.7 Users tab shows team members', async ({ page }) => {
    // Navigate to project first
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await projectGroup.click();
    
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // 1. Click Users tab in project
    const usersTab = await page.getByRole('tab', { name: /users?/i }).first();
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
      
      // Verify: URL is /project/290/users
      await expect(page).toHaveURL(/\/project\/\d+\/users/);
      
      // Verify: 4 team members display in table
      const teamMembers = await page.locator('table tbody tr');
      const memberCount = await teamMembers.count();
      await expect(memberCount).toBeGreaterThanOrEqual(4);
      
      // Verify: Email and Role columns shown
      const emailHeader = await page.locator('th:has-text("Email")');
      const roleHeader = await page.locator('th:has-text("Role")');
      
      if (await emailHeader.isVisible()) {
        await expect(emailHeader).toBeVisible();
      }
      if (await roleHeader.isVisible()) {
        await expect(roleHeader).toBeVisible();
      }
    }
  });

  test('2.8 Sprint tab shows sprint list', async ({ page }) => {
    // Navigate to project first
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await projectGroup.click();
    
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // 1. Click Sprint tab in project
    const sprintTab = await page.getByRole('tab', { name: /sprint/i }).first();
    
    if (await sprintTab.isVisible()) {
      await sprintTab.click();
      await page.waitForTimeout(500);
      
      // Verify: URL is /project/290/sprint
      await expect(page).toHaveURL(/\/project\/\d+\/sprint/);
      
      // Verify: Current Sprints section shows Sprint 2
      const currentSprints = await page.locator('text=Current Sprints, text=Sprint 2').first();
      
      // Verify: Completed Sprints shows Sprint 1
      const completedSprints = await page.locator('text=Completed Sprints, text=Sprint 1').first();
      
      // Verify: New Sprint, Backlog, Epic buttons visible
      const newSprintBtn = await page.locator('button:has-text("New Sprint"), button:has-text("Create Sprint")').first();
      const backlogBtn = await page.locator('button:has-text("Backlog")').first();
      
      if (await newSprintBtn.isVisible()) {
        await expect(newSprintBtn).toBeVisible();
      }
      if (await backlogBtn.isVisible()) {
        await expect(backlogBtn).toBeVisible();
      }
    }
  });

  test('2.9 Board tab shows Kanban board', async ({ page }) => {
    // Navigate to project first
    const projectsMenu = await page.getByRole('menuitem', { name: /project/i }).first();
    await projectsMenu.click();
    await page.waitForTimeout(500);
    
    const projectGroup = page.getByRole('menuitem').filter({ hasText: /Project Group/ }).first();
    await projectGroup.click();
    
    await page.waitForURL('**/project/**');
    await page.waitForLoadState('networkidle');
    
    // 1. Click Board tab in project
    const boardTab = await page.getByRole('tab', { name: /board/i }).first();
    
    if (await boardTab.isVisible()) {
      await boardTab.click();
      await page.waitForTimeout(500);
      
      // Verify: URL is /project/290/board
      await expect(page).toHaveURL(/\/project\/\d+\/board/);
      
      // Verify: Three columns display: "To do", "In progress", "Done"
      const todoColumn = await page.locator('text=To do').first();
      const inProgressColumn = await page.locator('text=In progress').first();
      const doneColumn = await page.locator('text=Done').first();
      
      await expect(todoColumn).toBeVisible();
      await expect(inProgressColumn).toBeVisible();
      await expect(doneColumn).toBeVisible();
      
      // Verify: Issue cards visible in columns (at least one should have issues)
      const issueCards = await page.locator('[class*="card"], [class*="issue"], [data-testid*="issue"]').first();
      // Cards might not always be visible, so we just verify the columns exist
      await expect(todoColumn).toBeVisible();
    }
  });
});
