import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@/lib/test-utils';
import Login, { LoginProps } from '@/features/auth/login/Login';
import SignInForm from '@/features/auth/password/components/SignInForm';
import { TEXTS as LOGIN_TEXTS } from '@/features/auth/login/constants';
import { AUTH_FORMS, AUTH_FORM_CONFIG } from '@/features/auth/constant';

type User = ReturnType<typeof userEvent.setup>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// ─── 1. Auth Locators (SRP: Querying DOM Elements) ───────────────────────────

export const authLocators = {
  phoneInput: (name: RegExp | string = new RegExp(LOGIN_TEXTS.label, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.getByRole('textbox', { name: regex });
  },
  phoneInputByPlaceholder: (placeholder: RegExp | string = new RegExp(LOGIN_TEXTS.placeholder, 'i')) => {
    const regex = typeof placeholder === 'string' ? new RegExp(placeholder, 'i') : placeholder;
    return screen.getByPlaceholderText(regex);
  },
  phoneLabel: () => screen.getByLabelText(LOGIN_TEXTS.label),

  passwordInput: () => screen.getByPlaceholderText('••••••••'),
  passwordLabel: (text: RegExp | string = /رمز عبور/i) => {
    const regex = typeof text === 'string' ? new RegExp(text, 'i') : text;
    return screen.getByText(regex, { selector: 'label' });
  },
  passwordToggle: (name: RegExp | string = /نمایش|مخفی/i) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.getByRole('button', { name: regex });
  },

  otpInputs: () => screen.getAllByRole('textbox'),

  alert: () => screen.getByRole('alert'),
  queryAlert: () => screen.queryByRole('alert'),
  errorMessage: (text: RegExp | string) => {
    const regex = typeof text === 'string' ? new RegExp(text, 'i') : text;
    return screen.getByText(regex);
  },
  queryErrorMessage: (text: RegExp | string) => {
    const regex = typeof text === 'string' ? new RegExp(text, 'i') : text;
    return screen.queryByText(regex);
  },

  submitButton: (name: RegExp | string = new RegExp(LOGIN_TEXTS.submit, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.getByRole('button', { name: regex });
  },
  querySubmitButton: (name: RegExp | string = new RegExp(LOGIN_TEXTS.submit, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.queryByRole('button', { name: regex });
  },
};

// ─── 2. Auth Actions (SRP: User Interactions) ────────────────────────────────

export const createAuthActions = (user: User) => ({
  fillPhone: (phone: string) => user.type(authLocators.phoneInput(), phone),
  clearPhone: () => user.clear(authLocators.phoneInput()),
  submitPhone: () => user.type(authLocators.phoneInput(), '{Enter}'),

  fillPassword: (password: string) => user.type(authLocators.passwordInput(), password),
  clearPassword: () => user.clear(authLocators.passwordInput()),
  togglePassword: () => user.click(authLocators.passwordToggle()),

  fillOtp: async (otp: string) => {
    const inputs = authLocators.otpInputs();
    for (let i = 0; i < otp.length && i < inputs.length; i++) {
      await user.type(inputs[i], otp[i]);
    }
  },

  clickSubmit: (name?: RegExp | string) => user.click(authLocators.submitButton(name)),
});

// ─── 3. Login Driver ─────────────────────────────────────────────────────────

export interface LoginDriverOptions {
  onSubmit?: LoginProps['onSubmit'];
}

export function createLoginDriver(options: LoginDriverOptions = {}) {
  const onSubmit = options.onSubmit ?? jest.fn();
  const user = userEvent.setup();
  const actions = createAuthActions(user);

  render(<Login onSubmit={onSubmit} />);

  return {
    user,
    onSubmit,
    ...actions,

    // Element queries
    phoneLabel: authLocators.phoneLabel,
    phoneInput: () => authLocators.phoneInput(),
    phoneInputByPlaceholder: () => authLocators.phoneInputByPlaceholder(),
    alert: authLocators.alert,
    queryAlert: authLocators.queryAlert,
    submitButton: () => authLocators.submitButton(LOGIN_TEXTS.submit),
    submittingButton: () => authLocators.submitButton(LOGIN_TEXTS.isSubmitting),
    querySubmitButton: () => authLocators.querySubmitButton(LOGIN_TEXTS.submit),
    querySubmittingButton: () => authLocators.querySubmitButton(LOGIN_TEXTS.isSubmitting),

    // Flow Action
    fillAndSubmit: async (phone: string) => {
      await actions.fillPhone(phone);
      await actions.clickSubmit(LOGIN_TEXTS.submit);
    },
  };
}

// ─── 4. Register (Sign Up Finalize) Driver ───────────────────────────────────

export interface SignUpFinalizeDriverOptions {
  phoneNumber?: string;
  defaultPassword?: string;
  defaultOtp?: string;
}

export function createSignUpFinalizeDriver(options: SignUpFinalizeDriverOptions = {}) {
  const user = userEvent.setup();
  const actions = createAuthActions(user);
  const submitText = AUTH_FORM_CONFIG[AUTH_FORMS.SIGN_UP_FINALIZE].submitText;

  renderWithProviders(
    <SignInForm
      defaultValues={{
        authForm: AUTH_FORMS.SIGN_UP_FINALIZE,
        phoneNumber: options.phoneNumber ?? '09171234567',
        password: options.defaultPassword ?? '',
        otp: options.defaultOtp ?? '',
      }}
    />
  );

  return {
    user,
    ...actions,

    // Queries
    passwordLabel: () => authLocators.passwordLabel('رمز عبور جدید'),
    passwordInput: authLocators.passwordInput,
    passwordToggle: authLocators.passwordToggle,
    otpInputs: authLocators.otpInputs,
    alert: authLocators.alert,
    queryAlert: authLocators.queryAlert,
    errorMessage: authLocators.errorMessage,
    queryErrorMessage: authLocators.queryErrorMessage,
    submitButton: () => authLocators.submitButton(submitText),

    // Flow
    fillAndSubmit: async (otp: string, password: string) => {
      await actions.fillOtp(otp);
      await actions.fillPassword(password);
      await actions.clickSubmit(submitText);
    },
  };
}

// ─── 5. Reset Password (Forgot Pass Finalize) Driver ─────────────────────────

export interface ResetPasswordFinalizeDriverOptions {
  phoneNumber?: string;
  defaultPassword?: string;
  defaultOtp?: string;
}

export function createResetPasswordFinalizeDriver(options: ResetPasswordFinalizeDriverOptions = {}) {
  const user = userEvent.setup();
  const actions = createAuthActions(user);
  const submitText = AUTH_FORM_CONFIG[AUTH_FORMS.FORGOT_PASS_FINALIZE].submitText;

  renderWithProviders(
    <SignInForm
      defaultValues={{
        authForm: AUTH_FORMS.FORGOT_PASS_FINALIZE,
        phoneNumber: options.phoneNumber ?? '09171234567',
        password: options.defaultPassword ?? '',
        otp: options.defaultOtp ?? '',
      }}
    />
  );

  return {
    user,
    ...actions,

    // Queries
    passwordLabel: () => authLocators.passwordLabel('رمز عبور جدید'),
    passwordInput: authLocators.passwordInput,
    passwordToggle: authLocators.passwordToggle,
    otpInputs: authLocators.otpInputs,
    alert: authLocators.alert,
    queryAlert: authLocators.queryAlert,
    errorMessage: authLocators.errorMessage,
    queryErrorMessage: authLocators.queryErrorMessage,
    submitButton: () => authLocators.submitButton(submitText),

    // Flow
    fillAndSubmit: async (otp: string, password: string) => {
      await actions.fillOtp(otp);
      await actions.fillPassword(password);
      await actions.clickSubmit(submitText);
    },
  };
}
