import { render, screen, userEvent } from '@/lib/test-utils';
import Login, { LoginProps } from '@/features/auth/login/Login';
import { TEXTS as LOGIN_TEXTS } from '@/features/auth/login/constants';

type User = ReturnType<typeof userEvent.setup>;

// ─── 1. Auth Locators ────────────────────────────────────────────────────────

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
  alert: () => screen.getByRole('alert'),
  queryAlert: () => screen.queryByRole('alert'),
  submitButton: (name: RegExp | string = new RegExp(LOGIN_TEXTS.submit, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.getByRole('button', { name: regex });
  },
  querySubmitButton: (name: RegExp | string = new RegExp(LOGIN_TEXTS.submit, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.queryByRole('button', { name: regex });
  },
};

// ─── 2. Auth Actions ─────────────────────────────────────────────────────────

export const createAuthActions = (user: User) => ({
  fillPhone: (phone: string) => user.type(authLocators.phoneInput(), phone),
  clearPhone: () => user.clear(authLocators.phoneInput()),
  submitPhone: () => user.type(authLocators.phoneInput(), '{Enter}'),
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
