/// <reference types="@testing-library/jest-dom" />
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import OtpInputSection from '../OtpInputSection';

const TWO_MINUTES_MS = 120000;

function TestWrapper({ onResend }: { onResend?: () => void }) {
  const methods = useForm({
    defaultValues: {
      otp: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <OtpInputSection onResend={onResend} />
    </FormProvider>
  );
}

describe('OtpInputSection — 2-minute timer & Resend OTP', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the initial 2-minute countdown timer (02:00)', () => {
    render(<TestWrapper />);
    expect(screen.getByText(/02:00/)).toBeInTheDocument();
  });

  it('renders resend button after 2 minutes and calls onResend when clicked', async () => {
    const onResend = jest.fn();
    render(<TestWrapper onResend={onResend} />);

    expect(screen.getByText(/02:00/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(TWO_MINUTES_MS);
    });

    const resendBtn = screen.getByRole('button', { name: 'ارسال مجدد کد' });
    expect(resendBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(resendBtn);
    });

    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/02:00/)).toBeInTheDocument();
  });
});
