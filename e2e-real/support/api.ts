import type { APIRequestContext } from '@playwright/test';
import { readOtp } from './db';
import { E2E_ENV } from './env';
import { E2E_PASSWORD, uniquePhone } from './identities';
import type { SellerApplication } from './sellers';

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

/**
 * Applies as a seller through POST /pre-register, the endpoint behind
 * /seller/apply. The backend only queues it; see waitForSellerApplication.
 */
export async function applyAsSeller(request: APIRequestContext, application: SellerApplication): Promise<void> {
  const response = await request.post(`${E2E_ENV.apiUrl}/pre-register`, {
    data: {
      name: application.firstName,
      lastName: application.lastName,
      phoneNumber: application.phoneNumber,
      nationalIdNumber: application.nationalId,
      province: application.province,
      city: application.city,
      instagramId: application.instagramId,
      followersCount: application.followers,
      productCategory: application.category,
      bio: application.description,
      // The form always sends this; the backend requires it
      businessType: 'نامشخص',
    },
  });
  if (!response.ok()) {
    throw new Error(`POST /pre-register failed: ${response.status()} ${await response.text()}`);
  }
}
