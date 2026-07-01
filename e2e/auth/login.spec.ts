/**
 * E2E Tests — Auth / Login
 *
 * Layer:   E2E (real Chromium browser, running Next.js server)
 * Runner:  Playwright
 * Pattern: Page Object Model (LoginPage) + custom fixtures
 *
 * QA mandate:
 *   E2E tests verify user-facing behaviour in a REAL browser.
 *   They do NOT substitute for unit/component tests — each layer has a job:
 *     Unit     → schema logic correctness (loginSchema.test.ts)
 *     Component → render & interaction (Login.test.tsx)
 *     E2E       → full stack integration + real browser quirks + accessibility tree
 *
 * Rules:
 *   ✅ Use Page Object Model — no raw locators in this file
 *   ✅ Use custom fixtures from e2e/fixtures/index.ts
 *   ✅ Use shared test data from features/auth/login/__tests__/fixtures/phones.ts
 *   ✅ No waitForTimeout — only deterministic waits (expect().toBeVisible(), etc.)
 *   ✅ Each test is fully independent — no ordering dependency
 *   ✅ Descriptive test names (reads like a specification)
 */

import { test, expect } from '../fixtures';
import {
  VALID_PHONES,
  INVALID_PHONES,
} from '../../features/auth/login/__tests__/fixtures/phones';
import { TEXTS } from '../../features/auth/login/constants';

// ─── Suite 1: Page load ───────────────────────────────────────────────────────

test.describe('Login page — initial state', () => {
  test('renders the inShop logo', async ({ loginPage }) => {
    await expect(loginPage.logo).toBeVisible();
  });

  test('renders the page heading with correct Persian text', async ({ loginPage }) => {
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.pageTitle).toHaveText(TEXTS.title);
  });

  test('renders the subtitle text', async ({ loginPage }) => {
    await expect(loginPage.subtitle).toBeVisible();
  });

  test('renders the terms text', async ({ loginPage }) => {
    await expect(loginPage.termsText).toBeVisible();
  });

  test('phone input is visible and enabled', async ({ loginPage }) => {
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.phoneInput).toBeEnabled();
  });

  test('submit button is disabled on fresh load', async ({ loginPage }) => {
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('page URL is /auth/login', async ({ loginPage }) => {
    await loginPage.assertOnLoginPage();
  });
});

// ─── Suite 2: Valid phone inputs ──────────────────────────────────────────────

test.describe('Login page — valid phone inputs', () => {
  test('standard 09xx phone enables the submit button', async ({ loginPage }) => {
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('phone without leading zero keeps the submit button disabled', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.withoutLeadingZero);
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('+98 international format keeps the submit button disabled', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.international);
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('no error message is visible after valid input', async ({ loginPage }) => {
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.errorMessage).not.toBeVisible();
  });

  test('phone input has aria-invalid=false after valid input', async ({ loginPage }) => {
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.phoneInput).toHaveAttribute('aria-invalid', 'false');
  });
});

// ─── Suite 3: Invalid phone inputs + error feedback ───────────────────────────

test.describe('Login page — invalid phone inputs', () => {
  test('too-short phone keeps submit button disabled', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('too-long phone keeps submit button disabled', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooLong);
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('foreign number keeps submit button disabled', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.foreign);
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('alphabetic input keeps submit button disabled', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.letters);
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('error message appears after invalid input', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('phone input has aria-invalid=true after invalid input', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.phoneInput).toHaveAttribute('aria-invalid', 'true');
  });
});

// ─── Suite 4: Recovery path ───────────────────────────────────────────────────

test.describe('Login page — error recovery', () => {
  test('error clears and button enables after correcting invalid to valid', async ({
    loginPage,
  }) => {
    // Step 1: Enter invalid phone → error state
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.submitButton).toBeDisabled();
    await expect(loginPage.errorMessage).toBeVisible();

    // Step 2: Clear and enter valid phone → recovers
    await loginPage.clearPhone();
    await loginPage.fillPhone(VALID_PHONES.standard);

    await expect(loginPage.submitButton).toBeEnabled();
    await expect(loginPage.errorMessage).not.toBeVisible();
    await expect(loginPage.phoneInput).toHaveAttribute('aria-invalid', 'false');
  });
});

// ─── Suite 5: Keyboard interactions ──────────────────────────────────────────

test.describe('Login page — keyboard interactions', () => {
  test('pressing Enter on empty form does not navigate away', async ({
    loginPage,
  }) => {
    await loginPage.pressEnter();
    // Should still be on login page — no submission occurred
    await loginPage.assertOnLoginPage();
  });

  test('pressing Enter with invalid phone does not navigate away', async ({
    loginPage,
  }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await loginPage.pressEnter();
    await loginPage.assertOnLoginPage();
  });

  test('Tab moves focus from phone input to submit button', async ({
    loginPage,
    page,
  }) => {
    // Button must be enabled for Tab to land on it — disabled elements are skipped
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.submitButton).toBeEnabled();
    await loginPage.phoneInput.focus();
    await page.keyboard.press('Tab');
    await expect(loginPage.submitButton).toBeFocused();
  });
});

// ─── Suite 6: Accessibility ───────────────────────────────────────────────────

test.describe('Login page — accessibility', () => {
  test('phone input has type=tel', async ({ loginPage }) => {
    await expect(loginPage.phoneInput).toHaveAttribute('type', 'tel');
  });

  test('phone input label is associated (getByLabel resolves correctly)', async ({
    loginPage,
    page,
  }) => {
    // loginPage fixture navigates to the page first
    // If label/htmlFor is broken, this locator returns nothing
    const input = page.getByLabel(TEXTS.label);
    await expect(input).toBeVisible();
  });

  test('submit button has type=submit', async ({ loginPage }) => {
    await expect(loginPage.submitButton).toHaveAttribute('type', 'submit');
  });

  test('page has a single h2 heading', async ({ loginPage, page }) => {
    const headings = page.getByRole('heading', { level: 2 });
    await expect(headings).toHaveCount(1);
  });
});

// ─── Suite 7: Mobile viewport (Pixel 5) ──────────────────────────────────────
// These run automatically in the 'mobile-chrome' Playwright project.

test.describe('Login page — mobile viewport', () => {
  test('page renders without horizontal scroll', async ({ loginPage, page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('phone input is visible above the fold', async ({ loginPage, page }) => {
    const inputBox = await loginPage.phoneInput.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(inputBox).not.toBeNull();
    expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('submit button is visible above the fold', async ({ loginPage, page }) => {
    const buttonBox = await loginPage.submitButton.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(viewportHeight);
  });
});

// ─── Suite 8: API integration (real flow) ───────────────────────────────────

test.describe('Login page — API integration (real flow)', () => {
  test('submits successfully, shows success toast and navigates to OTP page', async ({
    loginPage,
    page,
  }) => {
    await loginPage.mockSendOtpSuccess();
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.submitButton).toBeEnabled();

    const toastPromise = page.getByText('کد تایید ارسال شد');
    await loginPage.submit();

    // Verify success toast appears
    await expect(toastPromise).toBeVisible();

    // Verify redirection to /auth/otp with the phone query parameter
    await expect(page).toHaveURL(new RegExp(`/auth/otp\\?phone=${encodeURIComponent(VALID_PHONES.standard)}`));
  });

  test('shows error toast when sendOtp API fails and stays on page', async ({
    loginPage,
    page,
  }) => {
    const errorMsg = 'خطا در ارسال کد تایید';
    await loginPage.mockSendOtpError(errorMsg);
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.submitButton).toBeEnabled();

    const toastPromise = page.getByText(errorMsg);
    await loginPage.submit();

    // Verify error toast appears
    await expect(toastPromise).toBeVisible();

    // Assert that we are still on the login page
    await loginPage.assertOnLoginPage();
  });
});

