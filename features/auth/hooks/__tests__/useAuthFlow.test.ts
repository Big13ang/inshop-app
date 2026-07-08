import { renderHook, act } from '@testing-library/react';
import { useAuthFlow } from '../useAuthFlow';
import { toast } from 'sonner';

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
        error: { message: 'شماره تلفن نامعتبر است' },
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.sendOtp('09000000000');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('شماره تلفن نامعتبر است');
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

      expect(toast.error).toHaveBeenCalledWith('خطا در ارسال کد تایید');
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
      expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
    });

    it('returns false and shows error toast on failure', async () => {
      mockVerify.mockResolvedValue({
        error: { message: 'کد تایید نامعتبر است' },
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.verifyOtp('0000', '09171234567');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('کد تایید نامعتبر است');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('redirects to custom path when onSuccessRedirect is provided', async () => {
      mockVerify.mockResolvedValue({ error: null });

      const { result } = renderHook(() =>
        useAuthFlow({ onSuccessRedirect: '/custom/path' })
      );

      await act(async () => {
        await result.current.verifyOtp('1234', '09171234567');
      });

      expect(mockPush).toHaveBeenCalledWith('/custom/path');
    });
  });

  describe('redirectToOtp', () => {
    it('navigates to OTP page with encoded phone number', () => {
      const { result } = renderHook(() => useAuthFlow());

      act(() => {
        result.current.redirectToOtp('09171234567');
      });

      expect(mockPush).toHaveBeenCalledWith('/auth/otp?phone=09171234567');
    });

    it('encodes special characters in phone number', () => {
      const { result } = renderHook(() => useAuthFlow());

      act(() => {
        result.current.redirectToOtp('0917 123 4567');
      });

      expect(mockPush).toHaveBeenCalledWith('/auth/otp?phone=0917%20123%204567');
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
        error: { message: 'خطا در خروج' },
      });

      const { result } = renderHook(() => useAuthFlow());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.signOut();
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('خطا در خروج');
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
      expect(toast.error).toHaveBeenCalledWith('خطا در خروج از حساب کاربری');
    });
  });
});
