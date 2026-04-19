import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ quiet: true });

export default defineConfig({
  testDir: './tests',
  testMatch: ['*.spec.ts'],
  grep: /(?!auth\.setup)/,
  // Enable sharding for parallel execution
  fullyParallel: false,
  // Fail the build on CI if test.only was accidentally committed
  forbidOnly: !!process.env.CI,
  // Retry once on CI to absorb flakiness from server load
  retries: process.env.CI ? 1 : 0,
  // Use 2 workers for sharded execution, 1 for serial execution
  workers: process.env.CI ? 2 : 1,
  // Increase timeout to 180 seconds for complex operations
  timeout: 180_000,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report-qa' }],
    ['blob', { outputDir: 'blob-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://trofos-production.comp.nus.edu.sg',
    // Keep a trace on first retry to aid debugging
    trace: 'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video on failure for debugging
    video: 'retain-on-failure',
    // Give the remote app plenty of time to respond
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'qa-chrome',
      use: { ...devices['Desktop Chrome'], storageState: 'auth-state-chromium.json' },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: undefined,
});
