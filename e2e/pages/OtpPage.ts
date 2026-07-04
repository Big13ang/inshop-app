/**
 * Page Object Model — OtpPage
 *
 * QA principle: Locators and user actions live HERE, not inside test files.
 * Test files describe WHAT to verify. This file describes HOW to interact.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { TEXTS } from '../../features/auth/otp/constants';
import { VALID_PHONES } from '../fixtures/phones';
import {
  mockVerifySuccess,
  mockVerifyError,
  mockResendSuccess,
  mockResendError,
} from '../fixtures/authMocks';

export class OtpPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly logo: Locator;
  readonly pageTitle: Locator;
  readonly editPhoneLink: Locator;
  readonly timerText: Locator;
  readonly resendButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logo = page.getByText('inShop', { exact: true });
    this.pageTitle = page.getByRole('heading', { name: TEXTS.title });
    this.editPhoneLink = page.getByRole('link', { name: TEXTS.editPhone });
    this.timerText = page.locator('span', { hasText: TEXTS.resendPrefix });
    this.resendButton = page.getByRole('button', { name: TEXTS.resendActive });
  }

  /** Get locator for a specific OTP digit input (0-3) */
  getOtpInput(index: number): Locator {
    return this.page.locator(`#otp-input-${index}`);
  }

  /** Get locator for the dynamic subtitle text with the phone number */
  getSubtitle(phone: string): Locator {
    return this.page.getByText(TEXTS.subtitle(phone));
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Navigate directly to the OTP page with a phone query parameter */
  async goto(phone = VALID_PHONES.standard) {
    await this.page.goto(`/auth/otp?phone=${encodeURIComponent(phone)}`);
    // Gate: wait for the first OTP input box to be visible
    await expect(this.getOtpInput(0)).toBeVisible();
  }

  /** Fill the OTP inputs sequentially */
  async fillOtp(code: string) {
    for (let i = 0; i < code.length; i++) {
      await this.getOtpInput(i).fill(code[i]);
    }
  }

  /** Assert current URL matches the OTP route */
  async assertOnOtpPage() {
    await expect(this.page).toHaveURL(/\/auth\/otp/);
  }

  /** Mock successful OTP verification response */
  async mockVerifySuccess() {
    await mockVerifySuccess(this.page);
  }

  /** Mock failed OTP verification response */
  async mockVerifyError(message = 'کد وارد شده صحیح نیست') {
    await mockVerifyError(this.page, message);
  }

  /** Mock successful OTP resend response */
  async mockResendSuccess() {
    await mockResendSuccess(this.page);
  }

  /** Mock failed OTP resend response */
  async mockResendError(message = 'محدودیت ارسال مجدد') {
    await mockResendError(this.page, message);
  }
}
