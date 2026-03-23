import { test as setup } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
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

  await page.context().storageState({ path: authFile });
});
