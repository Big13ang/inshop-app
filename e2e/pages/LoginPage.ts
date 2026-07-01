/**
 * Page Object Model — LoginPage
 *
 * QA principle: Locators and user actions live HERE, not inside test files.
 * Test files describe WHAT to verify. This file describes HOW to interact.
 *
 * Benefits:
 *   - Single place to update when the UI changes
 *   - Tests stay readable and implementation-agnostic
 *   - Shared across all E2E tests that touch the login page
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { TEXTS } from '../../features/auth/login/constants';

export class LoginPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  // Always prefer role/label/text queries — they match what users perceive
  // and what screen readers expose. Avoid CSS selectors / data-testid unless
  // absolutely necessary.

  readonly phoneInput: Locator;
  readonly submitButton: Locator;
  readonly logo: Locator;
  readonly pageTitle: Locator;
  readonly subtitle: Locator;
  readonly termsText: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.phoneInput = page.getByRole('textbox');
    this.submitButton = page.getByRole('button', { name: TEXTS.submit });
    this.logo = page.getByText('inShop', { exact: true });
    this.pageTitle = page.getByRole('heading', { name: TEXTS.title });
    this.subtitle = page.getByText(TEXTS.subtitle);
    this.termsText = page.getByText(TEXTS.terms);
    // Error message: visible text container (not just aria attributes)
    this.errorMessage = page.getByText(TEXTS.errorInvalidPhone);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Navigate to the login page and wait for it to be ready */
  async goto() {
    await this.page.goto('/auth/login');
    // Gate: don't proceed until the input is interactive
    await expect(this.phoneInput).toBeVisible();
  }

  /** Fill the phone input. Clears existing value first. */
  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  /** Clear the phone input */
  async clearPhone() {
    await this.phoneInput.clear();
  }

  /** Click the submit button */
  async submit() {
    await this.submitButton.click();
  }

  /** Type a valid phone and wait for the button to enable, then submit */
  async fillAndSubmit(phone: string) {
    await this.fillPhone(phone);
    await expect(this.submitButton).toBeEnabled();
    await this.submit();
  }

  /** Press Enter inside the phone input */
  async pressEnter() {
    await this.phoneInput.press('Enter');
  }

  /** Assert current URL matches the login route */
  async assertOnLoginPage() {
    await expect(this.page).toHaveURL(/\/auth\/login/);
  }

  /** Mock successful OTP generation response */
  async mockSendOtpSuccess() {
    await this.page.route('**/api/auth/phone-number/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'کد تایید ارسال شد' }),
      });
    });
  }

  /** Mock failed OTP generation response */
  async mockSendOtpError(message = 'خطا در ارسال کد تایید') {
    await this.page.route('**/api/auth/phone-number/send-otp', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message }),
      });
    });
  }
}
