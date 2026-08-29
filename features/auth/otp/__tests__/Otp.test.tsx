import React from 'react';
import { render, screen, act, userEvent, expect } from '@/lib/test-utils';
import Otp from '../Otp';
import { TEXTS } from '../constants';

interface SetupOptions {
  phone?: string;
  onComplete?: (code: string) => void;
  onResend?: () => void;
}

const setup = (options: SetupOptions = {}) => {
  const phone = options.phone ?? '09123456789';
  const onComplete = options.onComplete ?? jest.fn();
  const onResend = options.onResend ?? jest.fn();

  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  const renderResult = render(
    <Otp
      phone={phone}
      onComplete={onComplete}
      onResend={onResend}
    />
  );

  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];

  return {
    user,
    phone,
    onComplete,
    onResend,
    inputs,
    ...renderResult,
  };
};

describe('Otp Page Component - Integrated Behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render title, phone number subtitle, and edit phone link', () => {
    const { phone } = setup({ phone: '09171234567' });

    expect(screen.getByRole('heading', { name: TEXTS.title })).toBeInTheDocument();
    expect(screen.getByText(TEXTS.subtitle(phone))).toBeInTheDocument();

    const editPhoneLink = screen.getByRole('link', { name: TEXTS.editPhone });
    expect(editPhoneLink).toBeInTheDocument();
    expect(editPhoneLink).toHaveAttribute('href', '/auth/login');
  });

  it('should render 4 OTP input slots and countdown timer on load', () => {
    const { inputs } = setup();

    expect(inputs).toHaveLength(4);
    expect(screen.getByText(TEXTS.resendPrefix.trim())).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('should trigger onComplete when user enters 4 valid digits', async () => {
    const { user, inputs, onComplete } = setup();

    await user.type(inputs[0], '1');
    await user.type(inputs[1], '9');
    await user.type(inputs[2], '8');
    await user.type(inputs[3], '4');

    expect(onComplete).toHaveBeenCalledWith('1984');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should allow user to resend code after countdown expires and clear inputs', async () => {
    const { user, inputs, onResend } = setup();

    // Type some partial input
    await user.type(inputs[0], '7');
    await user.type(inputs[1], '3');
    expect(inputs[0]).toHaveValue('7');
    expect(inputs[1]).toHaveValue('3');

    // Fast-forward 120s to expire countdown
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    const resendButton = screen.getByRole('button', { name: TEXTS.resendActive });
    expect(resendButton).toBeInTheDocument();

    await act(async () => {
      await user.click(resendButton);
    });

    expect(onResend).toHaveBeenCalledTimes(1);

    // Inputs should be cleared
    inputs.forEach((input) => {
      expect(input).toHaveValue('');
    });

    // Countdown should be reset
    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TEXTS.resendActive })).not.toBeInTheDocument();
  });
});
