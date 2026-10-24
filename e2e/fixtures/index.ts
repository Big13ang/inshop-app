/**
 * Custom Playwright Test Fixtures
 *
 * QA principle: Fixtures eliminate boilerplate from test files.
 * Every test that uses `addPostPage` gets a pre-navigated instance for free —
 * without any beforeEach duplication.
 *
 * Usage:
 *   import { test, expect } from '../fixtures';
 *   test('my test', async ({ addPostPage }) => { ... });
 */

import { test as base } from '@playwright/test';
import { AddPostPage } from '../pages/AddPostPage';
import { E2E_MOCKS_ENABLED, E2E_SESSION_TOKEN } from './mode';
import { mockSignedInSeller } from './authMocks';

type Fixtures = {
  addPostPage: AddPostPage;
};

export const test = base.extend<Fixtures>({
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
    if (E2E_SESSION_TOKEN) {
      await context.addCookies([
        {
          name: 'better-auth.session_token',
          value: E2E_SESSION_TOKEN,
          domain: 'localhost',
          path: '/',
        },
      ]);
    }

    const addPostPage = new AddPostPage(page);

    if (E2E_MOCKS_ENABLED) {
      await mockSignedInSeller(page);
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
