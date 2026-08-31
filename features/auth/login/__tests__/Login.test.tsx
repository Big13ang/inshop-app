import { waitFor, expect } from '@/lib/test-utils';
import { TEXTS } from '../constants';
import { VALID_PHONES, INVALID_PHONES } from './fixtures/phones';
import { createLoginDriver } from '@/features/auth/testing/authDrivers';

describe('Login Component - Initial Rendering', () => {
  it('renders page header title and subtitle', () => {
    const page = createLoginDriver();

    expect(page.heading()).toBeInTheDocument();
    expect(page.subtitle()).toBeInTheDocument();
  });

  it('renders phone input associated with its label and correct attributes', () => {
    const page = createLoginDriver();

    expect(page.phoneLabel()).toBeInTheDocument();
    expect(page.phoneInput()).toHaveAttribute('type', 'tel');
    expect(page.phoneInput()).toHaveAttribute('placeholder', TEXTS.placeholder);
    expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders submit button in disabled state on initial load', () => {
    const page = createLoginDriver();

    expect(page.submitButton()).toBeInTheDocument();
    expect(page.submitButton()).toBeDisabled();
  });

  it('renders terms and conditions notice', () => {
    const page = createLoginDriver();

    expect(page.terms()).toBeInTheDocument();
  });

  it('does not display any validation error on fresh load', () => {
    const page = createLoginDriver();

    expect(page.queryAlert()).not.toBeInTheDocument();
  });
});

describe('Login Component - Input Validation', () => {
  it('shows error message and sets aria-invalid when invalid phone number is entered', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.tooShort);

    await waitFor(() => {
      expect(page.alert()).toBeInTheDocument();
      expect(page.alert()).toHaveTextContent(TEXTS.errorInvalidPhone);
      expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('clears error message and resets aria-invalid when input is corrected to a valid phone', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.tooShort);
    await waitFor(() => expect(page.queryAlert()).toBeInTheDocument());

    await page.clearPhone();
    await page.fillPhone(VALID_PHONES.standard);

    await waitFor(() => {
      expect(page.queryAlert()).not.toBeInTheDocument();
      expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'false');
    });
  });

  it('displays error for non-numeric phone input', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.letters);

    await waitFor(() => {
      expect(page.alert()).toBeInTheDocument();
      expect(page.alert()).toHaveTextContent(TEXTS.errorInvalidPhone);
    });
  });

  it('displays error when phone number format does not start with 09', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.withoutLeadingZero);

    await waitFor(() => {
      expect(page.alert()).toBeInTheDocument();
      expect(page.alert()).toHaveTextContent(TEXTS.errorInvalidPhone);
    });
  });
});

describe('Login Component - Submit Button State', () => {
  it('enables submit button when a valid phone number is entered', async () => {
    const page = createLoginDriver();

    await page.fillPhone(VALID_PHONES.standard);

    await waitFor(() => {
      expect(page.submitButton()).not.toBeDisabled();
    });
  });

  it('keeps submit button disabled when phone number is invalid', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.nineDigits);

    await waitFor(() => {
      expect(page.submitButton()).toBeDisabled();
    });
  });

  it('disables submit button again if valid phone number is deleted or cleared', async () => {
    const page = createLoginDriver();

    await page.fillPhone(VALID_PHONES.standard);
    await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

    await page.clearPhone();
    await waitFor(() => expect(page.submitButton()).toBeDisabled());
  });
});

describe('Login Component - Form Submission Flow', () => {
  it('calls onSubmit with valid phone number when submit button is clicked', async () => {
    const page = createLoginDriver();

    await page.fillAndSubmit(VALID_PHONES.standard);

    await waitFor(() => {
      expect(page.onSubmit).toHaveBeenCalledTimes(1);
      expect(page.onSubmit).toHaveBeenCalledWith({ phone: VALID_PHONES.standard });
    });
  });

  it('submits the form when Enter key is pressed in phone input with valid data', async () => {
    const page = createLoginDriver();

    await page.fillPhone(VALID_PHONES.standard);
    await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

    await page.submitPhone();

    await waitFor(() => {
      expect(page.onSubmit).toHaveBeenCalledTimes(1);
      expect(page.onSubmit).toHaveBeenCalledWith({ phone: VALID_PHONES.standard });
    });
  });

  it('does not submit when phone number is invalid', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.tooShort);
    await page.clickSubmit();

    expect(page.onSubmit).not.toHaveBeenCalled();
  });

  it('displays loading state and disables submit button during async submission', async () => {
    let resolveSubmit!: () => void;
    const asyncSubmit = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    const page = createLoginDriver({ onSubmit: asyncSubmit });

    await page.fillPhone(VALID_PHONES.standard);
    await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

    await page.clickSubmit();

    // During async submission
    await waitFor(() => {
      expect(page.querySubmittingButton()).toBeInTheDocument();
      expect(page.querySubmittingButton()).toBeDisabled();
      expect(page.querySubmitButton()).not.toBeInTheDocument();
    });

    // Resolve submission
    resolveSubmit();

    await waitFor(() => {
      expect(page.querySubmitButton()).toBeInTheDocument();
      expect(page.querySubmittingButton()).not.toBeInTheDocument();
    });
  });
});