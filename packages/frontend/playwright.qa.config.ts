import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './qa-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : 'html',
  timeout: 30000,
  use: {
    trace: 'on',
    actionTimeout: 15000,
    launchOptions: {
      slowMo: process.env.CI ? 0 : 1000,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
