/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../../../app/auth/login/page';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockSendOtp = jest.fn();
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    phoneNumber: {
      sendOtp: (...args: unknown[]) => mockSendOtp(...args),
      verify: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
});

describe('LoginPage Integration', () => {
  it('submits successfully and redirects to OTP page with correct query param', async () => {
    mockSendOtp.mockResolvedValue({
      data: { message: 'کد تایید ارسال شد' },
      error: null,
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const phoneInput = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button');

    await user.type(phoneInput, '09171234567');
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: '09171234567' });
      expect(toast.success).toHaveBeenCalledWith('کد تایید ارسال شد');
      expect(mockPush).toHaveBeenCalledWith('/auth/otp?phone=09171234567');
    });
  });

  it('displays an error toast when sendOtp API fails', async () => {
    mockSendOtp.mockResolvedValue({
      data: null,
      error: { message: 'شماره تلفن همراه وارد شده نامعتبر است.' },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const phoneInput = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button');

    await user.type(phoneInput, '09000000000');
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: '09000000000' });
      expect(toast.error).toHaveBeenCalledWith('شماره تلفن همراه وارد شده نامعتبر است.');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('displays the fallback error message when error.message is undefined', async () => {
    mockSendOtp.mockResolvedValue({
      data: null,
      error: {},
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const phoneInput = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button');

    await user.type(phoneInput, '09171234567');
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.auth.sendOtpFailed);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('recovers form state after API failure — button re-enables and allows resubmission', async () => {
    // First call fails, second call succeeds
    mockSendOtp
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'خطای موقت' },
      })
      .mockResolvedValueOnce({
        data: { message: 'کد تایید ارسال شد' },
        error: null,
      });

    const user = userEvent.setup();
    render(<LoginPage />);

    const phoneInput = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button');

    // Submit → API fails
    await user.type(phoneInput, '09171234567');
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('خطای موقت');
    });

    // Form should recover — button re-enabled, can resubmit
    await waitFor(() => expect(submitBtn).toBeEnabled());

    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith('کد تایید ارسال شد');
      expect(mockPush).toHaveBeenCalledWith('/auth/otp?phone=09171234567');
    });
  });
});
