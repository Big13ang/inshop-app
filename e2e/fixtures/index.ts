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

type Fixtures = {
  loginPage: LoginPage;
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
});

// Re-export expect so tests only need one import
export { expect } from '@playwright/test';
