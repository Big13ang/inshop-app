/**
 * E2E — Auth journeys on /auth/login: sign in, register, forgot password, log out.
 *
 * Sign-in and log-out run against the real backend too (E2E_PHONE / E2E_PASSWORD).
 * Log-out signs out a session this test creates itself, so the shared E2E_SESSION_TOKEN
 * used by other specs stays valid.
 *
 * Register and forgot password are mock-only: they need the SMS code, and a real
 * backend only exposes it when it runs with NODE_ENV=test.
 *
 * The redirect after sign-in (callbackUrl) is covered by callback-redirect.spec.ts.
 */

import { test, expect } from '@playwright/test';
import { E2E_ACCOUNT, E2E_MOCKS_ENABLED } from '../fixtures/mode';
import {
  INVALID_CREDENTIALS,
  mockPasswordResetApis,
  mockSignInApi,
  mockSignOutApi,
  mockSignUpApis,
  mockSignedInSeller,
} from '../fixtures/authMocks';
import { AuthPage } from '../pages/AuthPage';

const PROFILE = /\/app\/profile$/;
const LOGIN = /\/auth\/login/;
const PROFILE_MENU = 'منوی inShop';
const LOGOUT_ITEM = 'خروج از حساب کاربری';

test.describe('Auth — sign in', () => {
  test('a wrong password shows the error and keeps the seller on the login page', async ({ page }) => {
    await mockSignInApi(page, E2E_ACCOUNT.password);
    const auth = new AuthPage(page);
    await auth.goto();

    await auth.phoneInput.fill(E2E_ACCOUNT.phone);
    await auth.passwordInput.fill('wrongpass9');
    await auth.submitButton('SIGN_IN').click();

    await auth.expectErrorToast(INVALID_CREDENTIALS.message);
    await expect(page).toHaveURL(LOGIN);
  });
});

test.describe('Auth — log out', () => {
  test('logging out from the profile menu ends the session', async ({ page }) => {
    await mockSignInApi(page, E2E_ACCOUNT.password);
    await mockSignedInSeller(page);
    await mockSignOutApi(page);
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.signIn(E2E_ACCOUNT.phone, E2E_ACCOUNT.password);
    await expect(page).toHaveURL(PROFILE);

    await page.getByRole('button', { name: PROFILE_MENU }).click();
    await page.getByText(LOGOUT_ITEM, { exact: true }).click();
    await page.locator('#logout-confirm-btn').click();
    await expect(page).toHaveURL(LOGIN);

    // The session is gone: the app no longer lets the seller in.
    await page.goto('/app/profile');
    await expect(page).toHaveURL(LOGIN);
  });
});

test.describe('Auth — register and forgot password', () => {
  test.skip(!E2E_MOCKS_ENABLED, 'Mock-only: needs the SMS code, which a real dev backend does not expose');

  const PHONE = '09120000001';
  const CODE = '1234';
  const PASSWORD = 'newpass123';

  test.beforeEach(async ({ page }) => {
    await mockSignInApi(page, PASSWORD);
    await mockSignedInSeller(page);
  });

  test('register: request a code, set a password, and land signed in on the profile', async ({ page }) => {
    const signUps = await mockSignUpApis(page);
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.openRegister();

    await auth.requestCode('SIGN_UP_INIT', 'SIGN_UP_FINALIZE', PHONE);
    await auth.fillCodeAndPassword(CODE, PASSWORD);
    await auth.submitButton('SIGN_UP_FINALIZE').click();

    await expect(page).toHaveURL(PROFILE);
    expect(signUps).toEqual([{ phoneNumber: PHONE, otp: CODE, newPassword: PASSWORD }]);
  });

  test('forgot password: request a code, set a new password, and land signed in on the profile', async ({ page }) => {
    const resets = await mockPasswordResetApis(page);
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.openForgotPassword();

    await auth.requestCode('FORGOT_PASS_INIT', 'FORGOT_PASS_FINALIZE', PHONE);
    await auth.fillCodeAndPassword(CODE, PASSWORD);
    await auth.submitButton('FORGOT_PASS_FINALIZE').click();

    await expect(page).toHaveURL(PROFILE);
    expect(resets).toEqual([{ phoneNumber: PHONE, otp: CODE, newPassword: PASSWORD }]);
  });
});
