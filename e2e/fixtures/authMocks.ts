import { routeMock } from './mode';
/**
 * Shared auth API mock helpers for E2E tests.
 *
 * QA principle: Auth API contracts should be defined in ONE place.
 * Page objects call these helpers instead of defining responses inline.
 */

import { type Page } from '@playwright/test';
import type { UserMe } from '../../features/profile/services/profileService';

/** The signed-in seller that mock-mode runs use. Same shape as the backend's `GET /me` data. */
const MOCK_SELLER: UserMe = {
  id: 'user-1',
  name: 'فروشنده تست',
  email: 'seller@example.com',
  isVerifiedSeller: true,
  sellerActivatedAt: '2026-01-01T00:00:00.000Z',
  isAdmin: false,
  sellerProfile: {
    id: 'seller-1',
    userId: 'user-1',
    username: 'test_shop',
    shopName: 'فروشگاه تست',
  },
};

/**
 * Answers the client's `GET /me` like the backend: the seller while the session cookie is sent,
 * 401 once it is gone (after sign-out). Without it, the fake session cookie gets a 401 from
 * whatever backend is running and the app guard redirects to login mid-test.
 */
export async function mockSignedInSeller(page: Page) {
  await routeMock(
    page,
    (url) => url.pathname.endsWith('/me'),
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const { cookie = '' } = await route.request().allHeaders();
      if (!/better-auth\.session_token=[^;]+/.test(cookie)) {
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_SELLER }),
      });
    },
  );
}
