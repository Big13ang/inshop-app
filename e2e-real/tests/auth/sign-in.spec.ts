/**
 * Real-backend E2E — sign in with a password, stay signed in, log out
 *
 * Users are created through the real API first, so only the flow under test
 * goes through the UI.
 */

import { expect, test } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { createUser } from '../../support/api';
import { E2E_ENV } from '../../support/env';

test('an existing user signs in and the session survives a reload', async ({ page, request }) => {
  const user = await createUser(request);
  const auth = new AuthPage(page);

  await auth.goto();
  await auth.signIn(user.phoneNumber, user.password);

  await expect(page).toHaveURL(/\/app\/profile/);
  await expect(page.getByRole('heading', { name: user.phoneNumber })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/app\/profile/);
  await expect(page.getByRole('heading', { name: user.phoneNumber })).toBeVisible();
});

test('a wrong password is rejected and no session is created', async ({ page, request }) => {
  const user = await createUser(request);
  const auth = new AuthPage(page);

  await auth.goto();
  await auth.signIn(user.phoneNumber, 'wrongpass99');

  await expect(auth.heading('SIGN_IN')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
  const me = await page.request.get(`${E2E_ENV.apiUrl}/me`);
  expect(me.status()).toBe(401);
});

test('logging out ends the session and protects /app again', async ({ page, request }) => {
  const user = await createUser(request);
  const auth = new AuthPage(page);
  const profile = new ProfilePage(page);

  await auth.goto();
  await auth.signIn(user.phoneNumber, user.password);
  await expect(page).toHaveURL(/\/app\/profile/);

  await profile.logOut();

  await expect(auth.heading('SIGN_IN')).toBeVisible();
  const me = await page.request.get(`${E2E_ENV.apiUrl}/me`);
  expect(me.status()).toBe(401);

  await page.goto('/app/profile');
  await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fapp%2Fprofile/);
});
