/**
 * E2E run mode.
 *
 * E2E_MOCK=true    → browser-side API mocks are installed (no backend needed).
 * E2E_MOCK=false   → nothing is mocked; every request reaches the real backend.
 * (unset)          → same as false, so the default run is against the real stack.
 *
 * Real-backend runs need an existing account and session:
 *   E2E_PHONE, E2E_PASSWORD, E2E_SESSION_TOKEN
 * Optional for real-backend runs:
 *   E2E_IMAGE=<path>          image the add-post specs upload
 *   E2E_ALLOW_PUBLISH=true    also run specs that publish a real post
 */

import { type Page, test } from '@playwright/test';

export const E2E_MOCKS_ENABLED = process.env.E2E_MOCK === 'true';

export const E2E_ACCOUNT = {
  phone: process.env.E2E_PHONE ?? '09121234567',
  password: process.env.E2E_PASSWORD ?? 'abcdef12',
};

/** Session cookie for the add-post flow. Mocked runs use a fixed fake token. */
export const E2E_SESSION_TOKEN = E2E_MOCKS_ENABLED ? 'mock-session-token' : (process.env.E2E_SESSION_TOKEN ?? null);

/**
 * Call inside a test that publishes a post. Against a real backend that creates a real post on the
 * account, so it only runs when E2E_ALLOW_PUBLISH=true is set as well.
 */
export function skipUnlessPublishAllowed() {
  test.skip(
    !E2E_MOCKS_ENABLED && process.env.E2E_ALLOW_PUBLISH !== 'true',
    'Publishes a real post: set E2E_ALLOW_PUBLISH=true to run it against a real backend',
  );
}

/**
 * Installs a route mock only when mocks are enabled. With mocks off, the request
 * is left alone and reaches the real backend.
 */
export async function routeMock(
  page: Page,
  url: Parameters<Page['route']>[0],
  handler: Parameters<Page['route']>[1],
): Promise<void> {
  if (!E2E_MOCKS_ENABLED) return;
  await page.route(url, handler);
}
