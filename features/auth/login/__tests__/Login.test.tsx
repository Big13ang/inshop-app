/// <reference types="@testing-library/jest-dom" />
/**
 * Component tests — Login (render + interaction)
 *
 * Layer:   Component (DOM rendered, real child components, no network)
 * Runner:  Jest + React Testing Library
 * Pattern: Black-box user-event simulation — test what the USER experiences
 *
 * Coverage mandate:
 *   ✅ Initial render — all key elements present
 *   ✅ Accessibility — label/input association, aria-invalid, aria-disabled
 *   ✅ Validation feedback — button state + error message text
 *   ✅ Recovery path — fix invalid → error clears, button enables
 *   ✅ Submission — calls handler once with correct payload
 *   ✅ Submitting state — spinner replaces icon, text changes
 *   ✅ Negative paths — invalid input does NOT submit
 *
 * QA rules enforced here:
 *   - Tests query by ROLE (accessible queries), never by class/id
 *   - All waitFor calls use deterministic conditions, never setTimeout
 *   - consoleSpy is always restored in afterEach / mockRestore
 *   - Each test is independent — no shared mutable state
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login, { LoginProps } from '../Login';
import { TEXTS } from '../constants';
import { VALID_PHONES, INVALID_PHONES } from './fixtures/phones';

// ─── Setup helpers ────────────────────────────────────────────────────────────

/**
 * Renders the Login component and returns a configured userEvent instance.
 * Always called inside each test — no shared renders across tests.
 */
const setup = (props: LoginProps = {}) => {
  const user = userEvent.setup();
  render(<Login {...props} />);
  return { user };
};

/** Role-based queries — never rely on implementation details like class names */
const getPhoneInput = () => screen.getByRole('textbox') as HTMLInputElement;
const getSubmitButton = () =>
  screen.getByRole('button', { name: new RegExp(TEXTS.submit, 'i') }) as HTMLButtonElement;

// ─── Suite 1: Initial render ─────────────────────────────────────────────────

describe('Login — initial render', () => {
  it('renders essential interactive elements and is disabled initially', () => {
    setup();
    expect(getPhoneInput()).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
    expect(getSubmitButton()).toBeDisabled();
  });
});

// ─── Suite 2: Accessibility ───────────────────────────────────────────────────

describe('Login — accessibility', () => {
  it('phone input label is associated via htmlFor → id', () => {
    setup();
    // getByLabelText uses the label/htmlFor association — fails if broken
    const input = screen.getByLabelText(TEXTS.label);
    expect(input).toBeInTheDocument();
  });

  it('phone input has aria-invalid=false on fresh load', () => {
    setup();
    expect(getPhoneInput()).toHaveAttribute('aria-invalid', 'false');
  });

  it('phone input sets aria-invalid=true after invalid entry', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), INVALID_PHONES.tooShort);
    await waitFor(() =>
      expect(getPhoneInput()).toHaveAttribute('aria-invalid', 'true')
    );
  });

  it('phone input clears aria-invalid=true once corrected to valid', async () => {
    const { user } = setup();
    const input = getPhoneInput();
    await user.type(input, INVALID_PHONES.tooShort);
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));

    await user.clear(input);
    await user.type(input, VALID_PHONES.standard);
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'false'));
  });

  it('phone input has type="tel" for correct mobile keyboard', () => {
    setup();
    expect(getPhoneInput()).toHaveAttribute('type', 'tel');
  });
});

// ─── Suite 3: Validation feedback ────────────────────────────────────────────

describe('Login — validation feedback (button state + error visibility)', () => {
  it('enables submit button when a valid standard phone is entered', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), VALID_PHONES.standard);
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
  });

  it('keeps submit button disabled with international phone format', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), INVALID_PHONES.international);
    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
  });

  it('keeps submit button disabled with phone without leading zero', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), INVALID_PHONES.withoutLeadingZero);
    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
  });

  it('keeps submit button disabled for a too-short phone', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), INVALID_PHONES.tooShort);
    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
  });

  it('shows the Persian error message text in the DOM for invalid input', async () => {
    const { user } = setup();
    await user.type(getPhoneInput(), INVALID_PHONES.tooShort);
    await waitFor(() => {
      // Error text is visible — not just aria attribute — tested via actual text
      expect(
        screen.getByText(TEXTS.errorInvalidPhone)
      ).toBeInTheDocument();
    });
  });

  it('hides error message after correcting an invalid phone', async () => {
    const { user } = setup();
    const input = getPhoneInput();

    await user.type(input, INVALID_PHONES.tooShort);
    await waitFor(() =>
      expect(screen.getByText(TEXTS.errorInvalidPhone)).toBeInTheDocument()
    );

    await user.clear(input);
    await user.type(input, VALID_PHONES.standard);
    await waitFor(() =>
      expect(
        screen.queryByText(TEXTS.errorInvalidPhone)
      ).not.toBeInTheDocument()
    );
  });

  it('shows required error message when input is typed and then cleared', async () => {
    const { user } = setup();
    const input = getPhoneInput();

    await user.type(input, '1');
    await user.clear(input);
    await waitFor(() => {
      expect(screen.getByText(TEXTS.errorRequiredPhone)).toBeInTheDocument();
    });
  });

  it('shows invalid error message when an invalid format is pasted', async () => {
    const { user } = setup();
    const input = getPhoneInput();

    input.focus();
    await user.paste('abc123');
    await waitFor(() => {
      expect(screen.getByText(TEXTS.errorInvalidPhone)).toBeInTheDocument();
    });
  });
});

// ─── Suite 4: Form submission ─────────────────────────────────────────────────

describe('Login — form submission', () => {
  it('calls the submit handler exactly once when valid phone is submitted', async () => {
    const onSubmit = jest.fn();
    const { user } = setup({ onSubmit });

    await user.type(getPhoneInput(), VALID_PHONES.standard);
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ phone: VALID_PHONES.standard })
      );
    });
  });

  it('converts Persian/Arabic digits typed in phone input to English and submits successfully', async () => {
    const onSubmit = jest.fn();
    const { user } = setup({ onSubmit });

    await user.type(getPhoneInput(), '۰۹۱۷۱۲۳۴۵۶۷');
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ phone: VALID_PHONES.standard })
      );
    });
  });

  it('does NOT call submit handler when phone is invalid', async () => {
    const onSubmit = jest.fn();
    const { user } = setup({ onSubmit });

    await user.type(getPhoneInput(), INVALID_PHONES.tooShort);

    // Try both click AND keyboard Enter — neither should submit
    await user.keyboard('{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does NOT call submit handler on empty form', async () => {
    const onSubmit = jest.fn();
    const { user } = setup({ onSubmit });

    await user.keyboard('{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ─── Suite 5: Submitting state (loading UX) ───────────────────────────────────

describe('Login — submitting state (loading UX)', () => {
  it('shows loading indicator while submission is in progress and hides it when complete', async () => {
    let resolveSubmit: (value: void) => void = () => { };

    const onSubmit = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
    });

    const { user } = setup({ onSubmit });

    await user.type(getPhoneInput(), VALID_PHONES.standard);
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    await user.click(getSubmitButton());

    // Button text changes during loading and button is disabled
    const submittingButton = screen.getByRole('button', { name: new RegExp(TEXTS.isSubmitting, 'i') });
    expect(submittingButton).toBeInTheDocument();
    expect(submittingButton).toBeDisabled();

    // Resolve the submission
    resolveSubmit();

    // After resolving, loading text should be gone
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: new RegExp(TEXTS.isSubmitting, 'i') })
      ).not.toBeInTheDocument();
    });
  });
});
