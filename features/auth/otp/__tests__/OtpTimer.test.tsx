import React from 'react';
import { render, screen, act, userEvent, expect } from '@/lib/test-utils';
import OtpTimer from '../components/OtpTimer';
import { TEXTS } from '../constants';

interface SetupOptions {
  onResend?: () => void;
  resetOtp?: () => void;
  initialTime?: number;
  className?: string;
}

const setup = (options: SetupOptions = {}) => {
  const onResend = options.onResend ?? jest.fn();
  const resetOtp = options.resetOtp ?? jest.fn();
  const initialTime = options.initialTime ?? 120;
  const className = options.className;

  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  const renderResult = render(
    <OtpTimer
      onResend={onResend}
      resetOtp={resetOtp}
      initialTime={initialTime}
      className={className}
    />
  );

  return {
    user,
    onResend,
    resetOtp,
    ...renderResult,
  };
};

describe('OtpTimer - Countdown Behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display prefix text and formatted time (mm:ss) on initial load', () => {
    setup({ initialTime: 120 });

    expect(screen.getByText(TEXTS.resendPrefix.trim())).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TEXTS.resendActive })).not.toBeInTheDocument();
  });

  it('should format single-digit minutes and seconds with leading zeroes', () => {
    setup({ initialTime: 65 });

    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('should decrement remaining time every second', () => {
    setup({ initialTime: 10 });

    expect(screen.getByText('00:10')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('00:09')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  it('should show resend button and hide countdown text when timer expires', () => {
    setup({ initialTime: 5 });

    expect(screen.queryByRole('button', { name: TEXTS.resendActive })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('button', { name: TEXTS.resendActive })).toBeInTheDocument();
    expect(screen.queryByText(TEXTS.resendPrefix.trim())).not.toBeInTheDocument();
  });
});

describe('OtpTimer - Resend Action', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should call onResend, call resetOtp, and restart countdown when resend button is clicked', async () => {
    const { user, onResend, resetOtp } = setup({ initialTime: 3 });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const resendButton = screen.getByRole('button', { name: TEXTS.resendActive });
    await act(async () => {
      await user.click(resendButton);
    });

    expect(onResend).toHaveBeenCalledTimes(1);
    expect(resetOtp).toHaveBeenCalledTimes(1);
    expect(screen.getByText('00:03')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TEXTS.resendActive })).not.toBeInTheDocument();
  });
});
