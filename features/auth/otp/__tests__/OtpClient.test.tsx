/// <reference types="@testing-library/jest-dom" />
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpClient from '../OtpClient';
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

const mockMutate = jest.fn();
jest.mock('@/features/auth/hooks/useAuthMutations', () => ({
  useSendPhoneNumberOTPMutation: () => ({
    mutate: (...args: unknown[]) => mockMutate(...args),
    isPending: false,
  }),
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

  it('renders a link to the login page', () => {
    render(<OtpClient phone={TEST_PHONE} />);

    const editLink = screen.getByRole('link', { name: TEXTS.editPhone });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', '/auth/login');
  });

  it('handles resending the OTP code', async () => {
    render(<OtpClient phone={TEST_PHONE} />);

    act(() => {
      jest.advanceTimersByTime(120000);
    });

    const resendBtn = screen.getByRole('button', { name: TEXTS.resendActive });
    await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).click(resendBtn);

    expect(mockMutate).toHaveBeenCalledWith({ phoneNumber: TEST_PHONE });
  });
});
