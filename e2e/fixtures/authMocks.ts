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

export const authMockResponses = {
  sendOtpSuccess: { message: 'کد تایید ارسال شد' },
  sendOtpError: (message: string) => ({ message }),
  verifySuccess: {
    user: { id: 'user-1', phoneNumber: '09171234567' },
    session: { id: 'session-1' },
  },
  verifyError: (message: string) => ({ message }),
  resendSuccess: { message: 'کد مجدداً ارسال شد' },
} as const;

export async function mockSendOtp(
  page: Page,
  response: { message: string },
  status = 200
) {
  await routeMock(page, 
    (url) =>
      url.pathname.includes('/api/auth/phone-number/send-otp') ||
      url.pathname.includes('/api/auth/phone-number/request-sign-up'),
    async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );
}

export async function mockVerify(
  page: Page,
  response: Record<string, unknown>,
  status = 200
) {
  await routeMock(page, 
    (url) =>
      url.pathname.includes('/api/auth/phone-number/verify') ||
      url.pathname.includes('/api/auth/phone-number/sign-up'),
    async (route) => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (status === 200) {
        headers['set-cookie'] = 'better-auth.session_token=mock-session-token; Path=/; SameSite=Lax';
      }
      await route.fulfill({
        status,
        headers,
        body: JSON.stringify(response),
      });
    }
  );
}

export async function mockSendOtpSuccess(page: Page) {
  await mockSendOtp(page, authMockResponses.sendOtpSuccess);
}

export async function mockSendOtpError(
  page: Page,
  message = 'خطا در ارسال کد تایید'
) {
  await mockSendOtp(page, authMockResponses.sendOtpError(message), 400);
}

export async function mockVerifySuccess(page: Page) {
  await mockVerify(page, authMockResponses.verifySuccess);
}

export async function mockVerifyError(
  page: Page,
  message = 'کد وارد شده صحیح نیست'
) {
  await mockVerify(page, authMockResponses.verifyError(message), 400);
}

export async function mockResendSuccess(page: Page) {
  await mockSendOtp(page, authMockResponses.resendSuccess);
}

export async function mockResendError(
  page: Page,
  message = 'محدودیت ارسال مجدد'
) {
  await mockSendOtp(page, { message }, 400);
}
