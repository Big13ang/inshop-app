import { defineConfig, devices } from '@playwright/test';

/**
 * Real-backend E2E suite. Unlike e2e/ (mocked API), these tests drive the
 * production frontend build against a real backend, database and storage.
 * Start the stack with e2e-real/stack/run.sh, or point the URLs below at an
 * existing E2E environment.
 */

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  // One retry at most: a test that needs more is flaky and must be fixed
  retries: CI ? 1 : 0,
  reporter: [
    ['html', { open: 'never', outputFolder: '../playwright-report/e2e-real' }],
    ['list'],
  ],
  outputDir: '../test-results/e2e-real',
  globalSetup: './global-setup.ts',
  // Real requests on a busy CI machine take longer than the 5s default
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4100',
    locale: 'fa-IR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    // For machines whose installed Chromium doesn't match the Playwright version
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
