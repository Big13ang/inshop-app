/// <reference types="@testing-library/jest-dom" />
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Otp from '../Otp';
import { TEXTS } from '../constants';
import { VALID_PHONES } from '../../login/__tests__/fixtures/phones';
import { OTP_LENGTH } from '../hooks/otpLogic';

const TEST_PHONE = VALID_PHONES.standard;
const INITIAL_TIMER_TEXT = '02:00';
const TIMER_AFTER_ONE_SECOND = '01:59';
const TIMER_AFTER_ONE_MINUTE = '01:00';

const ONE_SECOND_MS = 1000;
const FIFTY_NINE_SECONDS_MS = 59000;
const TWO_MINUTES_MS = 120000;

const setup = (phone = TEST_PHONE) => {
  const user = userEvent.setup();
  const onComplete = jest.fn();
  const onResend = jest.fn();

  render(
    <Otp
      phone={phone}
      onComplete={onComplete}
      onResend={onResend}
    />
  );

  return {
    user,
    onComplete,
    onResend,
    getInputs: () => screen.getAllByRole('textbox'),
  };
};

describe('Otp Page — Initial Render & Timer Initialization', () => {
  it('renders essential interactive elements and initializes the 2-minute timer', () => {
    setup();

    expect(screen.getByRole('heading', { name: TEXTS.title })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TEST_PHONE))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: TEXTS.editPhone })).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(OTP_LENGTH);
    expect(screen.getByText(new RegExp(INITIAL_TIMER_TEXT))).toBeInTheDocument();
  });
});

describe('Otp Page — Focus Management', () => {
  it('automatically focuses the first input field on load', () => {
    const { getInputs } = setup();
    const inputs = getInputs();
    expect(inputs[0]).toHaveFocus();
  });

  it('moves focus to the next slot when a digit is typed', async () => {
    const { user, getInputs } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();

    await user.type(inputs[1], '2');
    expect(inputs[2]).toHaveFocus();
  });

  it('moves focus to the previous slot when backspace is pressed on an empty input', async () => {
    const { user, getInputs } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();

    await user.keyboard('{Backspace}');
    expect(inputs[0]).toHaveFocus();
  });

  it('does not move focus or change slot value when a non-digit character is typed', async () => {
    const { user, getInputs } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], 'a');
    expect(inputs[0]).toHaveValue('');
    expect(inputs[0]).toHaveFocus();
  });

  it('replaces the existing value when typing into an already-filled slot', async () => {
    const { user, getInputs } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], '1');
    expect(inputs[0]).toHaveValue('1');

    // Click back on the first slot and type a new digit
    await user.click(inputs[0]);
    await user.clear(inputs[0]);
    await user.type(inputs[0], '5');
    expect(inputs[0]).toHaveValue('5');
  });
});

describe('Otp Page — OTP Code Completion', () => {
  it('calls onComplete with the full code when all slots are filled', async () => {
    const { user, getInputs, onComplete } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');

    expect(onComplete).not.toHaveBeenCalled();

    await user.type(inputs[3], '4');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('converts Persian numbers to English digits and triggers onComplete', async () => {
    const { user, getInputs, onComplete } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], '۱'); // Persian 1
    await user.type(inputs[1], '۲'); // Persian 2
    await user.type(inputs[2], '۳'); // Persian 3
    await user.type(inputs[3], '۴'); // Persian 4

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('converts Arabic numbers to English digits and triggers onComplete', async () => {
    const { user, getInputs, onComplete } = setup();
    const inputs = getInputs();

    await user.type(inputs[0], '١'); // Arabic 1
    await user.type(inputs[1], '٢'); // Arabic 2
    await user.type(inputs[2], '٣'); // Arabic 3
    await user.type(inputs[3], '٤'); // Arabic 4

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('converts mixed Persian/Arabic/English pasted strings', async () => {
    const { getInputs, onComplete } = setup();
    const inputs = getInputs();

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: (format: string) => (format === 'text' ? '۱2٣4' : ''),
      },
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('handles pasting a too-short code by filling available slots and focusing next empty slot', async () => {
    const { getInputs, onComplete } = setup();
    const inputs = getInputs();

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: (format: string) => (format === 'text' ? '12' : ''),
      },
    });

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('');
    expect(inputs[2]).toHaveFocus();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('handles pasting a too-long mixed code by extracting only first 4 digits and completing', async () => {
    const { getInputs, onComplete } = setup();
    const inputs = getInputs();

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: (format: string) => (format === 'text' ? '12abc345' : ''),
      },
    });

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('4');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });
});

describe('Otp Page — Countdown Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('decrements the timer display every second', () => {
    setup();

    expect(screen.getByText(new RegExp(INITIAL_TIMER_TEXT))).toBeInTheDocument();

    // Advance time by 1 second
    act(() => {
      jest.advanceTimersByTime(ONE_SECOND_MS);
    });
    expect(screen.getByText(new RegExp(TIMER_AFTER_ONE_SECOND))).toBeInTheDocument();

    // Advance time by 59 seconds
    act(() => {
      jest.advanceTimersByTime(FIFTY_NINE_SECONDS_MS);
    });
    expect(screen.getByText(new RegExp(TIMER_AFTER_ONE_MINUTE))).toBeInTheDocument();
  });

  it('does not render the resend button while countdown is active', () => {
    setup();
    expect(screen.queryByRole('button', { name: TEXTS.resendActive })).not.toBeInTheDocument();
  });

  it('renders resend button when countdown completes, calls onResend, and resets timer on click', async () => {
    const { onResend } = setup();

    // Advance time by 120 seconds to finish countdown
    act(() => {
      jest.advanceTimersByTime(TWO_MINUTES_MS);
    });

    // Resend button should be visible
    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });
    expect(resendBtn).toBeInTheDocument();

    // Click resend button
    await act(async () => {
      fireEvent.click(resendBtn);
    });

    // Callback should be called
    expect(onResend).toHaveBeenCalledTimes(1);

    // Timer should be reset to 02:00
    expect(screen.getByText(new RegExp(INITIAL_TIMER_TEXT))).toBeInTheDocument();
  });

  it('clears all OTP input values and resets focus when resend button is clicked', async () => {
    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');

    act(() => {
      jest.advanceTimersByTime(TWO_MINUTES_MS);
    });

    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });

    await act(async () => {
      fireEvent.click(resendBtn);
    });

    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');
    expect(inputs[0]).toHaveFocus();
  });

  it('applies cursor-pointer class to edit phone and resend buttons', () => {
    setup();
    const editLink = screen.getByRole('link', { name: TEXTS.editPhone });
    expect(editLink).toHaveClass('cursor-pointer');

    act(() => {
      jest.advanceTimersByTime(TWO_MINUTES_MS);
    });
    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });
    expect(resendBtn).toHaveClass('cursor-pointer');
  });

  it('does not reset timer or clear inputs when onResend fails', async () => {
    const onResend = jest.fn().mockResolvedValue(false);
    const onComplete = jest.fn();

    render(
      <Otp
        phone={TEST_PHONE}
        onComplete={onComplete}
        onResend={onResend}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(inputs[0]).toHaveValue('1');

    act(() => {
      jest.advanceTimersByTime(TWO_MINUTES_MS);
    });

    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });
    expect(resendBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(resendBtn);
    });

    expect(onResend).toHaveBeenCalledTimes(1);

    expect(screen.queryByText(new RegExp(INITIAL_TIMER_TEXT))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: TEXTS.resendActive })).toBeInTheDocument();

    expect(inputs[0]).toHaveValue('1');
  });
});





