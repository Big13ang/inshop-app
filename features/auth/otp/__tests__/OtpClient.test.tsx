/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpClient from '../OtpClient';
import { toast } from 'sonner';
import { TEXTS } from '../constants';

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
const mockVerify = jest.fn();
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    phoneNumber: {
      sendOtp: (...args: any[]) => mockSendOtp(...args),
      verify: (...args: any[]) => mockVerify(...args),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('OtpClient Integration', () => {
  const TEST_PHONE = '09171234567';

  it('completes login successfully and redirects to /app/posts/new', async () => {
    mockVerify.mockResolvedValue({
      error: null,
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<OtpClient phone={TEST_PHONE} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith({
        code: '1234',
        phoneNumber: TEST_PHONE,
      });
      expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
    });
  });

  it('shows error toast when OTP verification fails', async () => {
    mockVerify.mockResolvedValue({
      error: { message: 'کد تایید نامعتبر است' },
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<OtpClient phone={TEST_PHONE} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '0');
    await user.type(inputs[1], '0');
    await user.type(inputs[2], '0');
    await user.type(inputs[3], '0');

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith({
        code: '0000',
        phoneNumber: TEST_PHONE,
      });
      expect(toast.error).toHaveBeenCalledWith('کد تایید نامعتبر است');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('handles resending the OTP code successfully', async () => {
    mockSendOtp.mockResolvedValue({
      data: { message: 'مجدداً ارسال شد' },
      error: null,
    });

    render(<OtpClient phone={TEST_PHONE} />);

    // Fast forward timer to enable resend button
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });
    await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).click(resendBtn);

    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: TEST_PHONE });
      expect(toast.success).toHaveBeenCalledWith('مجدداً ارسال شد');
    });
  });

  it('shows error toast when resending the OTP code fails', async () => {
    mockSendOtp.mockResolvedValue({
      data: null,
      error: { message: 'محدودیت ارسال مجدد کد' },
    });

    render(<OtpClient phone={TEST_PHONE} />);

    // Fast forward timer to enable resend button
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });
    await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).click(resendBtn);

    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: TEST_PHONE });
      expect(toast.error).toHaveBeenCalledWith('محدودیت ارسال مجدد کد');
    });
  });

  it('redirects to login page when edit phone button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<OtpClient phone={TEST_PHONE} />);

    const editBtn = screen.getByRole('button', { name: TEXTS.editPhone });
    await user.click(editBtn);

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});
