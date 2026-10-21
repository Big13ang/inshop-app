/**
 * Page Object Model — AuthPage (/auth/login)
 *
 * One page holds every auth step: sign in, register (request code → code + password)
 * and forgot password (request code → code + new password). Labels come from
 * features/auth/constant.ts so the specs follow the real UI text.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { AUTH_FORM_CONFIG, AUTH_FORM_HEADERS, type AuthForm } from '../../features/auth/constant';

const PHONE_PLACEHOLDER = '۰۹۱۲۳۴۵۶۷۸۹';
const FORGOT_PASSWORD_LINK = 'فراموشی رمز عبور؟';

export class AuthPage {
  readonly page: Page;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.getByPlaceholder(PHONE_PLACEHOLDER);
    this.passwordInput = page.locator('#password-input');
  }

  async goto() {
    await this.page.goto('/auth/login', { waitUntil: 'networkidle' });
    await this.expectStep('SIGN_IN');
  }

  /** The heading of each step is how the seller knows where they are. */
  async expectStep(step: AuthForm) {
    await expect(this.page.getByText(AUTH_FORM_HEADERS[step].title, { exact: true })).toBeVisible();
  }

  submitButton(step: AuthForm) {
    return this.page.getByRole('button', { name: AUTH_FORM_CONFIG[step].submitText, exact: true });
  }

  /**
   * Fill and submit a step. Retries until the app reacts, because a click that lands
   * before React hydrates is a native form submit that reloads the page.
   */
  async submit(step: AuthForm, fill: () => Promise<void>, untilLeft: () => Promise<void>) {
    await expect(async () => {
      await fill();
      await this.submitButton(step).click();
      await untilLeft();
    }).toPass({ timeout: 60_000 });
  }

  async signIn(phone: string, password: string) {
    await this.submit(
      'SIGN_IN',
      async () => {
        await this.phoneInput.fill(phone);
        await this.passwordInput.fill(password);
      },
      () => expect(this.page).not.toHaveURL(/\/auth\/login/, { timeout: 5_000 }),
    );
  }

  async openRegister() {
    await this.page.getByRole('button', { name: AUTH_FORM_CONFIG.SIGN_IN.secondaryAction!.text, exact: true }).click();
    await this.expectStep('SIGN_UP_INIT');
  }

  async openForgotPassword() {
    await this.page.getByText(FORGOT_PASSWORD_LINK, { exact: true }).click();
    await this.expectStep('FORGOT_PASS_INIT');
  }

  /** Request a code for `phone` from a "phone only" step and wait for the code step. */
  async requestCode(fromStep: AuthForm, toStep: AuthForm, phone: string) {
    await this.submit(
      fromStep,
      () => this.phoneInput.fill(phone),
      () => this.expectStep(toStep),
    );
  }

  /** Enter the code one digit per box, then the password. */
  async fillCodeAndPassword(code: string, password: string) {
    for (const [i, digit] of [...code].entries()) {
      await this.page.locator(`#otp-input-${i}`).fill(digit);
    }
    await this.passwordInput.fill(password);
  }

  async expectErrorToast(message: string) {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();
  }
}
