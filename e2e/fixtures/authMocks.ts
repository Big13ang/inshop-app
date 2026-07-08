/**
 * Shared auth API mock helpers for E2E tests.
 *
 * QA principle: Auth API contracts should be defined in ONE place.
 * Page objects call these helpers instead of defining responses inline.
 */

import { type Page } from '@playwright/test';

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
  await page.route('**/api/auth/phone-number/send-otp', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

export async function mockVerify(
  page: Page,
  response: Record<string, unknown>,
  status = 200
) {
  await page.route('**/api/auth/phone-number/verify', async (route) => {
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
  });
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
