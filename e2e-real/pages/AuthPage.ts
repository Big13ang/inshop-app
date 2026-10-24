import { type Locator, type Page, expect } from '@playwright/test';
import { AUTH_FORM_CONFIG, AUTH_FORM_HEADERS, AUTH_FORMS } from '@/features/auth/constant';

const OTP_LENGTH = 4;

/** The password-first auth screen at /auth/login: sign in, or switch to sign up */
export class AuthPage {
  readonly page: Page;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.locator('#sign-in-phone');
    this.passwordInput = page.locator('#password-input');
  }

  heading(form: keyof typeof AUTH_FORMS): Locator {
    return this.page.getByRole('heading', { name: AUTH_FORM_HEADERS[AUTH_FORMS[form]].title });
  }

  submitButton(form: keyof typeof AUTH_FORMS): Locator {
    return this.page.getByRole('button', { name: AUTH_FORM_CONFIG[AUTH_FORMS[form]].submitText });
  }

  async goto() {
    await this.page.goto('/auth/login');
    await expect(this.heading('SIGN_IN')).toBeVisible();
  }

  async signIn(phoneNumber: string, password: string) {
    await this.phoneInput.fill(phoneNumber);
    await this.passwordInput.fill(password);
    await this.submitButton('SIGN_IN').click();
  }

  /** Switches from sign-in to the sign-up form */
  async openSignUp() {
    const signUpText = AUTH_FORM_CONFIG[AUTH_FORMS.SIGN_IN].secondaryAction?.text ?? '';
    await this.page.getByRole('button', { name: signUpText, exact: true }).click();
    await expect(this.heading('SIGN_UP_INIT')).toBeVisible();
  }

  /** Submits the phone number; the backend issues a real OTP */
  async requestSignUpCode(phoneNumber: string) {
    await this.phoneInput.fill(phoneNumber);
    await this.submitButton('SIGN_UP_INIT').click();
    await expect(this.heading('SIGN_UP_FINALIZE')).toBeVisible();
  }

  /** Enters the OTP and a new password, then submits */
  async finishSignUp(code: string, password: string) {
    for (let i = 0; i < OTP_LENGTH; i++) {
      await this.page.locator(`#otp-input-${i}`).fill(code[i]);
    }
    await this.passwordInput.fill(password);
    await this.submitButton('SIGN_UP_FINALIZE').click();
  }
}
