import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://trofos-production.comp.nus.edu.sg/');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'NUS (Student)' }).click();
  await page.getByRole('textbox', { name: 'User Account' }).fill('e1291637@u.nus.edu');
  await page.getByRole('textbox', { name: 'Password' }).fill('3Qetfg_bBhdMcE;');
  await page.getByRole('button', { name: 'Sign in' }).click();
});