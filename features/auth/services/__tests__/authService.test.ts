import { authHttp } from '@/lib/utils';
import {
  sendPhoneNumberOTP,
  verifyPhoneNumber,
  signInPhoneNumber,
  requestPasswordResetPhoneNumber,
  resetPasswordPhoneNumber,
} from '../authService';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    authHttp: {
      post: jest.fn(),
      get: jest.fn(),
    },
    http: {
      post: jest.fn(),
      get: jest.fn(),
    },
  };
});

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPhoneNumberOTP', () => {
    it('calls POST api/auth/phone-number/request-sign-up with exact backend payload', async () => {
      (authHttp.post as jest.Mock).mockResolvedValue({ message: 'code sent' });

      const res = await sendPhoneNumberOTP({ phoneNumber: '09123456789' });

      expect(authHttp.post).toHaveBeenCalledWith(
        'api/auth/phone-number/request-sign-up',
        { phoneNumber: '09123456789' }
      );
      expect(res).toEqual({ message: 'code sent' });
    });
  });

  describe('verifyPhoneNumber', () => {
    it('calls POST api/auth/phone-number/sign-up with exact backend payload', async () => {
      (authHttp.post as jest.Mock).mockResolvedValue({
        token: 'test-token',
        user: { id: '1', name: 'User', phoneNumber: '09123456789' },
      });

      const res = await verifyPhoneNumber({
        phoneNumber: '09123456789',
        otp: '1234',
        newPassword: 'test1234',
      });

      expect(authHttp.post).toHaveBeenCalledWith(
        'api/auth/phone-number/sign-up',
        { phoneNumber: '09123456789', otp: '1234', newPassword: 'test1234' }
      );
      expect(res.token).toBe('test-token');
    });
  });

  describe('signInPhoneNumber', () => {
    it('calls POST api/auth/sign-in/phone-number with exact backend payload including rememberMe', async () => {
      (authHttp.post as jest.Mock).mockResolvedValue({ token: 'session-token' });

      const res = await signInPhoneNumber({
        phoneNumber: '09123456789',
        password: 'test1234',
      });

      expect(authHttp.post).toHaveBeenCalledWith(
        'api/auth/sign-in/phone-number',
        { phoneNumber: '09123456789', password: 'test1234', rememberMe: true }
      );
      expect(res.token).toBe('session-token');
    });
  });

  describe('requestPasswordResetPhoneNumber', () => {
    it('calls POST api/auth/phone-number/request-password-reset with exact payload', async () => {
      (authHttp.post as jest.Mock).mockResolvedValue({ status: true });

      const res = await requestPasswordResetPhoneNumber({ phoneNumber: '09123456789' });

      expect(authHttp.post).toHaveBeenCalledWith(
        'api/auth/phone-number/request-password-reset',
        { phoneNumber: '09123456789' }
      );
      expect(res).toEqual({ status: true });
    });
  });

  describe('resetPasswordPhoneNumber', () => {
    it('calls POST api/auth/phone-number/reset-password with exact payload', async () => {
      (authHttp.post as jest.Mock).mockResolvedValue({ status: true });

      const res = await resetPasswordPhoneNumber({
        phoneNumber: '09123456789',
        otp: '1234',
        newPassword: 'test1234',
      });

      expect(authHttp.post).toHaveBeenCalledWith(
        'api/auth/phone-number/reset-password',
        { phoneNumber: '09123456789', otp: '1234', newPassword: 'test1234' }
      );
      expect(res).toEqual({ status: true });
    });
  });
});
