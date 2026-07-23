/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpClient from '../OtpClient';
import { toast } from 'sonner';
import { TEXTS } from '../constants';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
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
      sendOtp: (...args: unknown[]) => mockSendOtp(...args),
      verify: (...args: unknown[]) => mockVerify(...args),
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

  it('completes login successfully and redirects to /app/posts/pending', async () => {
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
      expect(mockReplace).toHaveBeenCalledWith('/app/posts/pending');
    });
  });

  it('shows error toast when OTP verification fails', async () => {
    mockVerify.mockResolvedValue({
      error: { message: 'کد وارد شده نامعتبر است.' },
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
      expect(toast.error).toHaveBeenCalledWith('کد وارد شده نامعتبر است.');
      expect(mockReplace).not.toHaveBeenCalled();
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
      error: { message: 'محدودیت زمانی ارسال مجدد کد فعال است.' },
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
      expect(toast.error).toHaveBeenCalledWith('محدودیت زمانی ارسال مجدد کد فعال است.');
    });
  });

  it('renders a link to the login page', () => {
    render(<OtpClient phone={TEST_PHONE} />);

    const editLink = screen.getByRole('link', { name: TEXTS.editPhone });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', '/auth/login');
  });

  it('allows retry after failed verification — inputs remain usable and second attempt succeeds', async () => {
    // First verify fails, second succeeds
    mockVerify
      .mockResolvedValueOnce({
        error: { message: 'کد وارد شده نامعتبر است.' },
      })
      .mockResolvedValueOnce({
        error: null,
      });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<OtpClient phone={TEST_PHONE} />);

    const inputs = screen.getAllByRole('textbox');

    // First attempt — wrong code
    await user.type(inputs[0], '0');
    await user.type(inputs[1], '0');
    await user.type(inputs[2], '0');
    await user.type(inputs[3], '0');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('کد وارد شده نامعتبر است.');
    });

    // Inputs should still be in the DOM and interactive
    const inputsAfterError = screen.getAllByRole('textbox');
    expect(inputsAfterError).toHaveLength(4);

    // Clear and retry with correct code
    await user.clear(inputsAfterError[0]);
    await user.clear(inputsAfterError[1]);
    await user.clear(inputsAfterError[2]);
    await user.clear(inputsAfterError[3]);

    await user.type(inputsAfterError[0], '1');
    await user.type(inputsAfterError[1], '2');
    await user.type(inputsAfterError[2], '3');
    await user.type(inputsAfterError[3], '4');

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledTimes(2);
      expect(mockVerify).toHaveBeenLastCalledWith({
        code: '1234',
        phoneNumber: TEST_PHONE,
      });
      expect(mockReplace).toHaveBeenCalledWith('/app/posts/pending');
    });
  });
});
