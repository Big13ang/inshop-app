import { waitFor, expect } from '@/lib/test-utils';
import * as authService from '@/features/auth/services/authService';
import { VALID_PASSWORDS, INVALID_PASSWORDS } from './fixtures/passwords';
import { createSignUpFinalizeDriver } from '@/features/auth/testing/authDrivers';

describe('Register (SignUpFinalize) Component - Initial State', () => {
  it('renders 4 OTP inputs and password input with correct label and submit button', () => {
    const page = createSignUpFinalizeDriver();

    expect(page.passwordLabel()).toBeInTheDocument();
    expect(page.passwordInput()).toHaveAttribute('type', 'password');
    expect(page.otpInputs()).toHaveLength(4);
    expect(page.submitButton()).toBeInTheDocument();
  });

  it('does not display validation error before user interaction', () => {
    const page = createSignUpFinalizeDriver();

    expect(page.queryAlert()).not.toBeInTheDocument();
  });
});

describe('Register (SignUpFinalize) Component - Password Validation & Recovery', () => {
  it('shows error feedback when invalid password is entered', async () => {
    const page = createSignUpFinalizeDriver();

    await page.fillPassword(INVALID_PASSWORDS.tooShort);

    await waitFor(() => {
      expect(page.errorMessage(/حداقل ۸ کاراکتر/i)).toBeInTheDocument();
    });
  });

  it('clears error feedback when user corrects to a valid password', async () => {
    const page = createSignUpFinalizeDriver();

    await page.fillPassword(INVALID_PASSWORDS.tooShort);
    await waitFor(() => expect(page.errorMessage(/حداقل ۸ کاراکتر/i)).toBeInTheDocument());

    await page.clearPassword();
    await page.fillPassword(VALID_PASSWORDS.standard);

    await waitFor(() => {
      expect(page.queryErrorMessage(/حداقل ۸ کاراکتر/i)).not.toBeInTheDocument();
    });
  });
});

describe('Register (SignUpFinalize) Component - Form Submission Flow', () => {
  it('shows OTP error and prevents API call when submitting with incomplete OTP code', async () => {
    const verifySpy = jest.spyOn(authService, 'verifyPhoneNumber');
    const page = createSignUpFinalizeDriver();

    await page.fillAndSubmit('12', VALID_PASSWORDS.standard);

    await waitFor(() => {
      expect(page.errorMessage(/کد تأیید ۴ رقمی را وارد نمایید/i)).toBeInTheDocument();
    });

    expect(verifySpy).not.toHaveBeenCalled();
    verifySpy.mockRestore();
  });

  it('calls verifyPhoneNumber API with correct payload when valid 4-digit OTP and password are provided', async () => {
    const verifySpy = jest.spyOn(authService, 'verifyPhoneNumber').mockResolvedValue({
      status: true,
      token: 'test-token',
    });
    const page = createSignUpFinalizeDriver({ phoneNumber: '09171234567' });

    await page.fillAndSubmit('1234', VALID_PASSWORDS.standard);

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy).toHaveBeenCalledWith({
        phoneNumber: '09171234567',
        otp: '1234',
        newPassword: VALID_PASSWORDS.standard,
      });
    });

    verifySpy.mockRestore();
  });
});
