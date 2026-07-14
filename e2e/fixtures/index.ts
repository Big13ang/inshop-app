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
import { AddPostPage } from '../pages/AddPostPage';
import { env } from '@/env';

type Fixtures = {
  loginPage: LoginPage;
  otpPage: OtpPage;
  addPostPage: AddPostPage;
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

  /**
   * addPostPage fixture:
   * - Mocks the tus upload protocol (POST/HEAD/PATCH /api/upload) before
   *   navigation so upload requests never hit the real server
   * - Navigates to /app/posts/new
   * - Waits until the footer buttons are interactive (page is ready)
   *
   * Individual tests that need to simulate upload failure can call
   * addPostPage.mockUploadApiWithError() — LIFO routing means the later
   * handler takes priority over this fixture's success mock.
   */
  addPostPage: async ({ page, context }, use) => {
    const E2E_MOCK = env.E2E_MOCK !== 'false';

    if (E2E_MOCK) {
      // Set a mock session token cookie to bypass proxy authentication check
      await context.addCookies([
        {
          name: 'better-auth.session_token',
          value: 'mock-session-token',
          domain: 'localhost',
          path: '/',
        },
      ]);
    }

    const addPostPage = new AddPostPage(page);

    if (E2E_MOCK) {
      await addPostPage.mockUploadApi();
      await addPostPage.mockPublishApi();
    }

    await addPostPage.goto();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(addPostPage);
  },
});

// Re-export expect so tests only need one import
export { expect } from '@playwright/test';
