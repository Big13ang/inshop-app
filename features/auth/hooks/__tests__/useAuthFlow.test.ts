import { renderHook, act } from '@testing-library/react';
import { useAuthFlow } from '../useAuthFlow';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

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
const mockSignOut = jest.fn();

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    phoneNumber: {
      sendOtp: (...args: unknown[]) => mockSendOtp(...args),
      verify: (...args: unknown[]) => mockVerify(...args),
    },
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAuthFlow', () => {
  describe('sendOtp', () => {
    it('returns true and shows success toast on success', async () => {
      mockSendOtp.mockResolvedValue({
        data: { message: 'کد تایید ارسال شد' },
        error: null,
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.sendOtp('09171234567');
      });

      expect(success).toBe(true);
      expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: '09171234567' });
      expect(toast.success).toHaveBeenCalledWith('کد تایید ارسال شد');
    });

    it('returns false and shows error toast on failure', async () => {
      mockSendOtp.mockResolvedValue({
        data: null,
        error: { message: 'شماره تلفن همراه وارد شده نامعتبر است.' },
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.sendOtp('09000000000');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('شماره تلفن همراه وارد شده نامعتبر است.');
    });

    it('uses fallback message when error.message is undefined', async () => {
      mockSendOtp.mockResolvedValue({
        data: null,
        error: {},
      });

      const { result } = renderHook(() => useAuthFlow());

      await act(async () => {
        await result.current.sendOtp('09171234567');
      });

      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.auth.sendOtpFailed);
    });

    it('handles network/unexpected errors gracefully', async () => {
      mockSendOtp.mockRejectedValue(new Error('Network connection failed'));

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.sendOtp('09171234567');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Network connection failed');
    });
  });

  describe('verifyOtp', () => {
    it('returns true, shows success toast, and redirects on success', async () => {
      mockVerify.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.verifyOtp('1234', '09171234567');
      });

      expect(success).toBe(true);
      expect(mockVerify).toHaveBeenCalledWith({ code: '1234', phoneNumber: '09171234567' });
      expect(mockReplace).toHaveBeenCalledWith('/app/posts/pending');
    });

    it('returns false and shows error toast on failure', async () => {
      mockVerify.mockResolvedValue({
        error: { message: 'کد وارد شده نامعتبر است.' },
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.verifyOtp('0000', '09171234567');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('کد وارد شده نامعتبر است.');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('handles network/unexpected errors gracefully', async () => {
      mockVerify.mockRejectedValue(new Error('Verification network error'));

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.verifyOtp('1234', '09171234567');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Verification network error');
    });

    it('redirects to custom path when onSuccessRedirect is provided', async () => {
      mockVerify.mockResolvedValue({ error: null });

      const { result } = renderHook(() =>
        useAuthFlow({ onSuccessRedirect: '/custom/path' })
      );

      await act(async () => {
        await result.current.verifyOtp('1234', '09171234567');
      });

      expect(mockReplace).toHaveBeenCalledWith('/custom/path');
    });
  });

  describe('redirectToOtp', () => {
    it('navigates to OTP page with encoded phone number', () => {
      const { result } = renderHook(() => useAuthFlow());

      act(() => {
        result.current.redirectToOtp('09171234567');
      });

      expect(mockReplace).toHaveBeenCalledWith('/auth/otp?phone=09171234567');
    });

    it('encodes special characters in phone number', () => {
      const { result } = renderHook(() => useAuthFlow());

      act(() => {
        result.current.redirectToOtp('0917 123 4567');
      });

      expect(mockReplace).toHaveBeenCalledWith('/auth/otp?phone=0917%20123%204567');
    });
  });

  describe('signOut', () => {
    it('returns true on successful signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.signOut();
      });

      expect(success).toBe(true);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('returns false and shows toast on failure', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'عملیات خروج ناموفق بود.' },
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.signOut();
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('عملیات خروج ناموفق بود.');
    });

    it('uses fallback message when error message is missing', async () => {
      mockSignOut.mockResolvedValue({
        error: {},
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.signOut();
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.auth.signOutFailed);
    });

    it('handles network/unexpected errors gracefully', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out network error'));

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.signOut();
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Sign out network error');
    });
  });
});
