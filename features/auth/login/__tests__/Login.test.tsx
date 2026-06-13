import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const VALID_PHONE = '09171234567';

const setup = () => {
  const user = userEvent.setup();
  render(<Login />);
  return { user };
};

const getPhoneInput = () =>
  screen.getByRole('textbox') as HTMLInputElement;

const getSubmitButton = () =>
  screen.getByRole('button', { name: /دریافت کد|ارسال|submit/i }) as HTMLButtonElement;

// ────────────────────────────────────────────────────────────
// Slice 2: Renders actionable elements
// ────────────────────────────────────────────────────────────
describe('Login — renders actionable elements', () => {
  it('renders a phone input', () => {
    setup();
    expect(getPhoneInput()).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    setup();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it('submit button is disabled on initial render (empty form)', () => {
    setup();
    expect(getSubmitButton()).toBeDisabled();
  });

  it('phone input accepts text input', async () => {
    const { user } = setup();
    const input = getPhoneInput();
    await user.type(input, VALID_PHONE);
    expect(input.value).toBe(VALID_PHONE);
  });
});

// ────────────────────────────────────────────────────────────
// Slice 3: Validation feedback — button state + error visibility
// ────────────────────────────────────────────────────────────
describe('Login — validation feedback', () => {
  it('enables the submit button when a valid phone is entered', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), VALID_PHONE);
    await waitFor(() => {
      expect(getSubmitButton()).not.toBeDisabled();
    });
  });

  it('keeps submit button disabled when an invalid phone is entered', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), '12345');
    await waitFor(() => {
      expect(getSubmitButton()).toBeDisabled();
    });
  });

  it('shows an error indicator after typing an invalid phone', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), '12345');
    await waitFor(() => {
      // The input should have aria-invalid=true
      expect(getPhoneInput()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('does not show an error indicator for a valid phone', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), VALID_PHONE);
    await waitFor(() => {
      expect(getPhoneInput()).toHaveAttribute('aria-invalid', 'false');
    });
  });

  it('removes error state when user corrects an invalid phone to a valid one', async () => {
    const { user } = setup();
    const input = getPhoneInput();

    // First type an invalid phone
    await user.type(input, '12345');
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    // Clear and type a valid phone
    await user.clear(input);
    await user.type(input, VALID_PHONE);
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(getSubmitButton()).not.toBeDisabled();
    });
  });
});

// ────────────────────────────────────────────────────────────
// Slice 4: Form submission
// ────────────────────────────────────────────────────────────
describe('Login — form submission', () => {
  it('calls the submit handler exactly once when a valid phone is submitted', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const { user } = setup();

    await user.type(getPhoneInput(), VALID_PHONE);
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ phone: VALID_PHONE })
      );
    });

    consoleSpy.mockRestore();
  });

  it('does not submit when the phone is invalid', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const { user } = setup();

    await user.type(getPhoneInput(), '12345');

    // Button is disabled, but also try submitting via keyboard enter
    await user.keyboard('{Enter}');

    // console.log (onSubmit) should not have been called
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
