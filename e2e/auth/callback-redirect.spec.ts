/**
 * E2E — Login redirect: callbackUrl is only honoured for same-origin paths.
 *
 * The sign-in API is mocked in the browser so these tests cover the frontend
 * redirect logic without needing the backend.
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const PHONE = '09121234567';
const PASSWORD = 'abcdef12';
const DEFAULT_LANDING = '/app/profile';

const ME_BODY = {
  success: true,
  data: {
    id: '1',
    name: 'Tester',
    email: 'tester@example.com',
    isVerifiedSeller: false,
    sellerActivatedAt: null,
    isAdmin: false,
    sellerProfile: null,
  },
};

async function mockBackend(context: BrowserContext, apiBase: string) {
  await context.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const origin = request.headers().origin ?? '';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'content-type,accept-language',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    };
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/me') {
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(ME_BODY) });
    }
    if (pathname === '/api/auth/sign-in/phone-number') {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-token', user: { id: '1' } }),
      });
    }
    return route.fulfill({ status: 401, headers, contentType: 'application/json', body: '{"message":"Unauthorized"}' });
  });
}

async function blockExternalNavigations(context: BrowserContext, attempted: string[]) {
  await context.route('**/*', async (route) => {
    const request = route.request();
    const hostname = new URL(request.url()).hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal && request.isNavigationRequest()) {
      attempted.push(request.url());
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fallback();
  });
}

// The dev server hydrates the form late, so a submit made before hydration is a native
// form post and never reaches React. Retry the whole fill-and-submit until the page leaves login.
async function signInFrom(page: Page, callbackUrl: string | null) {
  const path = callbackUrl === null ? '/auth/login' : `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(async () => {
    await page.getByPlaceholder('۰۹۱۲۳۴۵۶۷۸۹').fill(PHONE);
    await page.locator('#password-input').fill(PASSWORD);
    await page.getByRole('button', { name: 'ورود به حساب کاربری', exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
}

test.describe('Login redirect after sign-in', () => {
  let attemptedExternal: string[];
  let dialogs: string[];

  test.beforeEach(async ({ context, page }) => {
    attemptedExternal = [];
    dialogs = [];
    await mockBackend(context, 'http://localhost:8000');
    await blockExternalNavigations(context, attemptedExternal);
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });
  });

  test('no callbackUrl lands on the profile page', async ({ page }) => {
    await signInFrom(page, null);
    await expect(page).toHaveURL(new RegExp(`${DEFAULT_LANDING}$`), { timeout: 30_000 });
  });

  test('an external https callbackUrl is ignored and the user is never sent off-site', async ({ page }) => {
    await signInFrom(page, 'https://evil.example');
    await expect(page).toHaveURL(new RegExp(`${DEFAULT_LANDING}$`), { timeout: 30_000 });
    expect(attemptedExternal).toEqual([]);
  });

  test('a protocol-relative callbackUrl is ignored', async ({ page }) => {
    await signInFrom(page, '//evil.example/x');
    await expect(page).toHaveURL(new RegExp(`${DEFAULT_LANDING}$`), { timeout: 30_000 });
    expect(attemptedExternal).toEqual([]);
  });

  test('a javascript: callbackUrl is ignored and runs no script', async ({ page }) => {
    await signInFrom(page, 'javascript:alert(1)');
    await expect(page).toHaveURL(new RegExp(`${DEFAULT_LANDING}$`), { timeout: 30_000 });
    expect(dialogs).toEqual([]);
  });

  test('an auth page callbackUrl is ignored so login does not loop', async ({ page }) => {
    await signInFrom(page, '/auth/otp');
    await expect(page).toHaveURL(new RegExp(`${DEFAULT_LANDING}$`), { timeout: 30_000 });
  });

  test('a same-origin path callbackUrl is honoured', async ({ page }) => {
    await signInFrom(page, '/app/posts/new');
    await expect(page).toHaveURL(/\/app\/posts\/new$/, { timeout: 30_000 });
  });

  test('a same-origin absolute callbackUrl is honoured', async ({ page, baseURL }) => {
    await signInFrom(page, `${baseURL}/app/posts/new`);
    await expect(page).toHaveURL(/\/app\/posts\/new$/, { timeout: 30_000 });
  });
});
