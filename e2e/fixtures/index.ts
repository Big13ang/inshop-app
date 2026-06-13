/**
 * Custom Playwright Test Fixtures
 *
 * QA principle: Fixtures eliminate boilerplate from test files.
 * Every test that uses `loginPage` gets a pre-navigated instance for free —
 * without any beforeEach duplication.
 *
 * Usage:
 *   import { test, expect } from '../fixtures';
 *   test('my test', async ({ loginPage }) => { ... });
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';

type Fixtures = {
  loginPage: LoginPage;
  otpPage: OtpPage;
};

export const test = base.extend<Fixtures>({
  /**
   * loginPage fixture:
   * - Creates a new LoginPage instance
   * - Navigates to /auth/login
   * - Waits until the phone input is visible (page is interactive)
   * - Tears down automatically after each test (browser handles cleanup)
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(loginPage);
  },

  /**
   * otpPage fixture:
   * - Creates a new OtpPage instance
   * - Leaves navigation to individual tests as the phone parameter varies
   */
  otpPage: async ({ page }, use) => {
    const otpPage = new OtpPage(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(otpPage);
  },
});

// Re-export expect so tests only need one import
export { expect } from '@playwright/test';
