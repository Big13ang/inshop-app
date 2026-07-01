/**
 * E2E Tests — Auth / OTP
 *
 * Layer:   E2E (real Chromium browser, running Next.js server)
 * Runner:  Playwright
 * Pattern: Page Object Model (OtpPage) + custom fixtures
 */

import { test, expect } from '../fixtures';
import { TEXTS } from '../../features/auth/otp/constants';
import { VALID_PHONES } from '../../features/auth/login/__tests__/fixtures/phones';

// ─── Suite 1: Page load & initial state ────────────────────────────────────────

test.describe('OTP page — initial state', () => {
  test('renders the inShop logo', async ({ otpPage }) => {
    await otpPage.goto();
    await expect(otpPage.logo).toBeVisible();
  });

  test('renders the page heading with correct Persian text', async ({ otpPage }) => {
    await otpPage.goto();
    await expect(otpPage.pageTitle).toBeVisible();
    await expect(otpPage.pageTitle).toHaveText(TEXTS.title);
  });

  test('renders the subtitle containing the formatted phone number', async ({ otpPage }) => {
    const phone = VALID_PHONES.standard;
    await otpPage.goto(phone);
    const subtitle = otpPage.getSubtitle(phone);
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText(TEXTS.subtitle(phone));
  });

  test('first OTP input field is focused automatically on load', async ({ otpPage }) => {
    await otpPage.goto();
    await expect(otpPage.getOtpInput(0)).toBeFocused();
  });

  test('edit phone button is visible and redirects to /auth/login', async ({ otpPage, page }) => {
    await otpPage.goto();
    await expect(otpPage.editPhoneButton).toBeVisible();
    await otpPage.editPhoneButton.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('timer starts at 02:00 and resend button is hidden', async ({ otpPage }) => {
    await otpPage.goto();
    await expect(otpPage.timerText).toBeVisible();
    await expect(otpPage.timerText).toContainText('02:00');
    await expect(otpPage.resendButton).not.toBeVisible();
  });

  test('page URL has correct path and parameters', async ({ otpPage }) => {
    await otpPage.goto();
    await otpPage.assertOnOtpPage();
  });
});

// ─── Suite 2: Focus transitions ──────────────────────────────────────────────

test.describe('OTP page — focus management', () => {
  test('moves focus to the next slot when a digit is entered', async ({ otpPage }) => {
    await otpPage.goto();
    
    // Type in slot 0
    await otpPage.getOtpInput(0).fill('1');
    await expect(otpPage.getOtpInput(1)).toBeFocused();

    // Type in slot 1
    await otpPage.getOtpInput(1).fill('2');
    await expect(otpPage.getOtpInput(2)).toBeFocused();
  });

  test('moves focus to the previous slot when backspace is pressed on an empty field', async ({ otpPage }) => {
    await otpPage.goto();
    
    // Fill first slot
    await otpPage.getOtpInput(0).fill('1');
    await expect(otpPage.getOtpInput(1)).toBeFocused();

    // Press backspace on empty second slot
    await otpPage.getOtpInput(1).press('Backspace');
    await expect(otpPage.getOtpInput(0)).toBeFocused();
  });
});

// ─── Suite 3: Localization and Digit Translation ─────────────────────────────

test.describe('OTP page — input translation', () => {
  test('converts Persian digits to English numbers', async ({ otpPage }) => {
    await otpPage.goto();
    
    // Type Persian digit "۱"
    await otpPage.getOtpInput(0).fill('۱');
    await expect(otpPage.getOtpInput(0)).toHaveValue('1');
    
    // Type Persian digit "۲"
    await otpPage.getOtpInput(1).fill('۲');
    await expect(otpPage.getOtpInput(1)).toHaveValue('2');
  });

  test('converts Arabic digits to English numbers', async ({ otpPage }) => {
    await otpPage.goto();
    
    // Type Arabic digit "٣"
    await otpPage.getOtpInput(0).fill('٣');
    await expect(otpPage.getOtpInput(0)).toHaveValue('3');
    
    // Type Arabic digit "٤"
    await otpPage.getOtpInput(1).fill('٤');
    await expect(otpPage.getOtpInput(1)).toHaveValue('4');
  });
});

// ─── Suite 4: Clock manipulation & Resend Flow ───────────────────────────────

test.describe('OTP page — timer & resend flow', () => {
  test('resend button appears after countdown completes and resets on click', async ({ page, otpPage }) => {
    // Install the clock before navigating so we can freeze/control time, starting at the current time to avoid hydration mismatch
    await page.clock.install({ time: new Date() });
    await otpPage.goto();

    // Initially active countdown timer
    await expect(otpPage.timerText).toContainText('02:00');
    await expect(otpPage.resendButton).not.toBeVisible();

    // Fast-forward by 200 seconds to ensure expiration under any hydration or CPU delays
    await page.clock.runFor(200_000);

    // Timer text is gone, resend button is active
    await expect(otpPage.timerText).not.toBeVisible();
    await expect(otpPage.resendButton).toBeVisible();

    // Fill some slots before clicking resend to verify cleanup
    await otpPage.getOtpInput(0).fill('5');
    await otpPage.getOtpInput(1).fill('6');

    // Click resend button
    await otpPage.resendButton.click();

    // Timer resets back to 02:00 countdown
    await expect(otpPage.timerText).toBeVisible();
    await expect(otpPage.timerText).toContainText('02:00');
    await expect(otpPage.resendButton).not.toBeVisible();

    // Focus resets to the first slot and all inputs are empty
    await expect(otpPage.getOtpInput(0)).toBeFocused();
    await expect(otpPage.getOtpInput(0)).toHaveValue('');
    await expect(otpPage.getOtpInput(1)).toHaveValue('');
  });
});

// ─── Suite 5: Responsive viewport ────────────────────────────────────────────

test.describe('OTP page — mobile viewport', () => {
  test('page renders without horizontal scroll', async ({ otpPage, page }) => {
    await otpPage.goto();
    // Set to a standard mobile width (iPhone 14 equivalent is 390px)
    await page.setViewportSize({ width: 390, height: 844 });
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});

// ─── Suite 6: API integration (real flow) ───────────────────────────────────

test.describe('OTP page — API integration (real flow)', () => {
  test('verifies OTP successfully and redirects to /app/posts/new', async ({
    otpPage,
    page,
  }) => {
    await otpPage.mockVerifySuccess();
    await otpPage.goto();

    await otpPage.fillOtp('1234');

    // Verify redirection to /app/posts/new
    await expect(page).toHaveURL(/\/app\/posts\/new/);
  });

  test('shows error toast when OTP verification fails', async ({
    otpPage,
    page,
  }) => {
    const errorMsg = 'کد وارد شده صحیح نیست';
    await otpPage.mockVerifyError(errorMsg);
    await otpPage.goto();

    await otpPage.fillOtp('0000');

    // Verify error toast appears
    await expect(page.getByText(errorMsg)).toBeVisible({ timeout: 5_000 });

    // Assert that we are still on the OTP page
    await otpPage.assertOnOtpPage();
  });

  test('shows success toast when resending OTP succeeds', async ({
    otpPage,
    page,
  }) => {
    await page.clock.install({ time: new Date() });
    await otpPage.mockResendSuccess();
    await otpPage.goto();

    // Wait for the timer to initialize and show 02:00, ensuring React has mounted and started the interval
    await expect(otpPage.timerText).toContainText('02:00');

    // Fast-forward by 200 seconds
    await page.clock.runFor(200_000);

    // Resend button should be visible, click it
    await expect(otpPage.resendButton).toBeVisible();
    await otpPage.resendButton.click();

    // Verify success toast appears
    await expect(page.getByText('کد مجدداً ارسال شد')).toBeVisible({ timeout: 5_000 });
  });

  test('shows error toast when resending OTP fails', async ({
    otpPage,
    page,
  }) => {
    await page.clock.install({ time: new Date() });
    const errorMsg = 'محدودیت ارسال مجدد';
    await otpPage.mockResendError(errorMsg);
    await otpPage.goto();

    // Wait for the timer to initialize and show 02:00, ensuring React has mounted and started the interval
    await expect(otpPage.timerText).toContainText('02:00');

    // Fast-forward by 200 seconds
    await page.clock.runFor(200_000);

    // Resend button should be visible, click it
    await expect(otpPage.resendButton).toBeVisible();
    await otpPage.resendButton.click();

    // Verify error toast appears
    await expect(page.getByText(errorMsg)).toBeVisible({ timeout: 5_000 });
  });
});

