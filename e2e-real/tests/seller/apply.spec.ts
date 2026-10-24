/**
 * Real-backend E2E — apply as a seller at /seller/apply
 *
 * The backend queues each application. Once it is stored, the account with
 * that phone number becomes a verified seller, right away or when it signs up
 * later, and its profile page sends it to fill in the shop profile.
 */

import { expect, test } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';
import { ProfileEditPage } from '../../pages/ProfileEditPage';
import { SellerApplyPage } from '../../pages/SellerApplyPage';
import { applyAsSeller, createUser } from '../../support/api';
import { readOtp, waitForSellerApplication } from '../../support/db';
import { E2E_PASSWORD, uniquePhone } from '../../support/identities';
import { newSellerApplication } from '../../support/sellers';

test('a signed-in user who applies becomes a seller without signing in again', async ({ page, request }) => {
  const user = await createUser(request);
  const auth = new AuthPage(page);
  const sellerApply = new SellerApplyPage(page);
  const profileEdit = new ProfileEditPage(page);

  await auth.goto();
  await auth.signIn(user.phoneNumber, user.password);
  await expect(page).toHaveURL(/\/app\/profile/);

  await sellerApply.goto();
  await sellerApply.apply(newSellerApplication(user.phoneNumber));
  await expect(sellerApply.successHeading).toBeVisible();

  // The queue stores the application in the background, so reload until it has
  await expect(async () => {
    await page.goto('/app/profile');
    await expect(profileEdit.newSellerNotice).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/app\/profile\/edit/);
});

test('someone who applied before signing up is a seller from their first sign-in', async ({ page }) => {
  const phoneNumber = uniquePhone();
  const sellerApply = new SellerApplyPage(page);
  const auth = new AuthPage(page);
  const profileEdit = new ProfileEditPage(page);

  await sellerApply.goto();
  await sellerApply.apply(newSellerApplication(phoneNumber));
  await expect(sellerApply.successHeading).toBeVisible();
  await waitForSellerApplication(phoneNumber);

  await auth.goto();
  await auth.openSignUp();
  await auth.requestSignUpCode(phoneNumber);
  await auth.finishSignUp(await readOtp('sign-up', phoneNumber), E2E_PASSWORD);
  await expect(page).not.toHaveURL(/\/auth\/login/);

  await page.goto('/app/profile');
  await expect(profileEdit.newSellerNotice).toBeVisible();
  await expect(page).toHaveURL(/\/app\/profile\/edit/);
});

test('a phone number that already applied is turned away', async ({ page, request }) => {
  const phoneNumber = uniquePhone();
  await applyAsSeller(request, newSellerApplication(phoneNumber));
  await waitForSellerApplication(phoneNumber);
  const sellerApply = new SellerApplyPage(page);

  await sellerApply.goto();
  await sellerApply.apply(newSellerApplication(phoneNumber));

  await expect(sellerApply.submitError).toContainText('قبلاً ثبت‌نام کرده است');
  await expect(sellerApply.successHeading).toBeHidden();
});
