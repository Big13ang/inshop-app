import type { APIRequestContext } from '@playwright/test';
import { readOtp } from './db';
import { E2E_ENV } from './env';
import { E2E_PASSWORD, uniquePhone } from './identities';

export interface TestUser {
  phoneNumber: string;
  password: string;
}

// Better Auth rejects requests without a trusted Origin
const AUTH_HEADERS = { Origin: E2E_ENV.baseUrl };

async function postAuth(request: APIRequestContext, path: string, data: Record<string, string>) {
  const response = await request.post(`${E2E_ENV.apiUrl}/api/auth/${path}`, { data, headers: AUTH_HEADERS });
  if (!response.ok()) {
    throw new Error(`POST /api/auth/${path} failed: ${response.status()} ${await response.text()}`);
  }
}

/**
 * Signs a new user up through the real API, skipping the UI. Use the
 * `request` fixture so the browser page stays logged out.
 */
export async function createUser(request: APIRequestContext): Promise<TestUser> {
  const user = { phoneNumber: uniquePhone(), password: E2E_PASSWORD };
  await postAuth(request, 'phone-number/request-sign-up', { phoneNumber: user.phoneNumber });
  const otp = await readOtp('sign-up', user.phoneNumber);
  await postAuth(request, 'phone-number/sign-up', {
    phoneNumber: user.phoneNumber,
    otp,
    newPassword: user.password,
  });
  return user;
}
