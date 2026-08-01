/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../../../app/auth/login/page';
import { toast } from 'sonner';

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
const mockSignIn = jest.fn();
const mockVerify = jest.fn();

jest.mock('@/features/auth/hooks/useAuthMutations', () => ({
  useSendPhoneNumberOTPMutation: () => ({
    mutateAsync: (...args: unknown[]) => mockSendOtp(...args),
    isPending: false,
  }),
  useVerifyPhoneNumberMutation: () => ({
    mutateAsync: (...args: unknown[]) => mockVerify(...args),
    isPending: false,
  }),
  useSignInPhoneNumberMutation: () => ({
    mutateAsync: (...args: unknown[]) => mockSignIn(...args),
    isPending: false,
  }),
  useRequestPasswordResetPhoneNumberMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useResetPasswordPhoneNumberMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
});

describe('LoginPage Integration', () => {
  it('renders login page correctly', () => {
    render(<LoginPage />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
