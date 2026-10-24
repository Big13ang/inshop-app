/**
 * Real-backend E2E — sign up with a phone number
 *
 * No mocks: the OTP is issued by the backend and read from its database.
 */

import { expect, test } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';
import { readOtp } from '../../support/db';
import { E2E_ENV } from '../../support/env';
import { E2E_PASSWORD, uniquePhone } from '../../support/identities';

test('a new user signs up with an OTP and is logged in', async ({ page }) => {
  const phoneNumber = uniquePhone();
  const auth = new AuthPage(page);

  await auth.goto();
  await auth.openSignUp();
  await auth.requestSignUpCode(phoneNumber);
  const code = await readOtp('sign-up', phoneNumber);
  await auth.finishSignUp(code, E2E_PASSWORD);

  await expect(page).not.toHaveURL(/\/auth\/login/);

  // The session cookie the browser received is accepted by the backend
  const me = await page.request.get(`${E2E_ENV.apiUrl}/me`);
  expect(me.status()).toBe(200);
  const body = await me.json();
  expect(body.data.name).toBe(phoneNumber);
});

test('a wrong OTP is rejected and the user stays on the sign-up form', async ({ page }) => {
  const phoneNumber = uniquePhone();
  const auth = new AuthPage(page);

  await auth.goto();
  await auth.openSignUp();
  await auth.requestSignUpCode(phoneNumber);
  const code = await readOtp('sign-up', phoneNumber);
  const wrongCode = code === '0000' ? '1111' : '0000';
  await auth.finishSignUp(wrongCode, E2E_PASSWORD);

  await expect(auth.heading('SIGN_UP_FINALIZE')).toBeVisible();
  const me = await page.request.get(`${E2E_ENV.apiUrl}/me`);
  expect(me.status()).toBe(401);
});
