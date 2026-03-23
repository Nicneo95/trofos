import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './qa-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120000,
  use: {
    trace: 'on',
    actionTimeout: 30000,
    launchOptions: {
      slowMo: process.env.CI ? 0 : 1000,
    },
  },
  projects: [
    { name: 'setup', testMatch: /.*auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'qa-tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
