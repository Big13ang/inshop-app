import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

loadEnvConfig(process.cwd());

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',

  // Run all tests in parallel — each test file gets its own worker
  fullyParallel: true,

  // Fail the build if you accidentally left a test.only() in source
  forbidOnly: CI,

  // Retry flaky tests in CI only — locally, failures should be immediate
  retries: CI ? 2 : 0,

  // Limit workers in CI to avoid resource contention
  workers: CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ...(CI ? ([['github']] as const) : []),
  ],

  use: {
    // All tests navigate relative to this base URL
    baseURL: 'http://localhost:4000',

    // Capture full trace on first retry — gives you step-by-step timeline on failure
    trace: 'on-first-retry',

    // Screenshot the page when a test fails
    screenshot: 'only-on-failure',

    // Record video on first retry for slow reproduction issues
    video: 'on-first-retry',

    // Match the app's locale (Persian)
    locale: 'fa-IR',

    // Reasonable action/navigation timeouts
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Desktop Chromium (primary — fast feedback)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile — Pixel 5 viewport to verify responsive behaviour
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Tablet — iPad viewport to verify responsive behaviour
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad (gen 7)'],
        browserName: 'chromium',
      },
    },

    // Uncomment to enable cross-browser coverage in CI:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Automatically start the Next.js dev server before running tests.
  // In CI, the server must already be running (reuseExistingServer: false).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

