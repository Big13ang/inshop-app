import { routeMock } from './mode';
/**
 * Shared auth API mock helpers for E2E tests.
 *
 * QA principle: Auth API contracts should be defined in ONE place.
 * Page objects call these helpers instead of defining responses inline.
 */

import { type Page, type Route } from '@playwright/test';
import type { UserMe } from '../../features/profile/services/profileService';
import type {
  ResetPasswordPhoneNumberPayload,
  VerifyPhoneNumberPayload,
} from '../../features/auth/services/authService';

/** What the backend answers for a wrong phone or password (HTTP 401). */
export const INVALID_CREDENTIALS = {
  message: 'شماره موبایل یا رمز عبور نادرست است.',
  code: 'INVALID_PHONE_OR_PASSWORD',
};

const SESSION_COOKIE = 'better-auth.session_token';

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

function fulfillJson(route: Route, status: number, body: unknown, headers: Record<string, string> = {}) {
  return route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
}

function onAuthPost(page: Page, path: string, handle: (route: Route) => Promise<void> | void) {
  return routeMock(
    page,
    (url) => url.pathname.endsWith(path),
    (route) => (route.request().method() === 'POST' ? handle(route) : route.fallback()),
  );
}

/**
 * Sign-in accepts only `password`; any other password gets the backend's 401.
 * A successful sign-in sets the session cookie, which `mockSignedInSeller` then honours.
 */
export async function mockSignInApi(page: Page, password: string) {
  await onAuthPost(page, '/api/auth/sign-in/phone-number', (route) => {
    const body = route.request().postDataJSON() as { password?: string };
    if (body.password !== password) return fulfillJson(route, 401, INVALID_CREDENTIALS);
    return fulfillJson(route, 200, { token: 'mock-session-token' }, {
      'set-cookie': `${SESSION_COOKIE}=mock-session-token; Path=/; SameSite=Lax`,
    });
  });
}

/** Sign-out clears the session cookie, as the backend does. */
export async function mockSignOutApi(page: Page) {
  await onAuthPost(page, '/api/auth/sign-out', (route) =>
    fulfillJson(route, 200, { success: true }, {
      'set-cookie': `${SESSION_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    }),
  );
}

/** Register: request a code, then sign up. Returns the sign-up payloads the app sent. */
export async function mockSignUpApis(page: Page) {
  const signUps: VerifyPhoneNumberPayload[] = [];
  await onAuthPost(page, '/api/auth/phone-number/request-sign-up', (route) => fulfillJson(route, 200, {}));
  await onAuthPost(page, '/api/auth/phone-number/sign-up', (route) => {
    signUps.push(route.request().postDataJSON() as VerifyPhoneNumberPayload);
    return fulfillJson(route, 200, {});
  });
  return signUps;
}

/** Forgot password: request a code, then reset. Returns the reset payloads the app sent. */
export async function mockPasswordResetApis(page: Page) {
  const resets: ResetPasswordPhoneNumberPayload[] = [];
  await onAuthPost(page, '/api/auth/phone-number/request-password-reset', (route) =>
    fulfillJson(route, 200, { status: true }),
  );
  await onAuthPost(page, '/api/auth/phone-number/reset-password', (route) => {
    resets.push(route.request().postDataJSON() as ResetPasswordPhoneNumberPayload);
    return fulfillJson(route, 200, { status: true });
  });
  return resets;
}
