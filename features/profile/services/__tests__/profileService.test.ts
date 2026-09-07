import {
  isUnauthorizedError,
  shouldRetryProfileQuery,
  getProfileRetryDelay,
  fetchMe,
  type UserProfile,
} from '../profileService';
import { authHttp } from '@/lib/utils';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    authHttp: {
      get: jest.fn(),
    },
  };
});

describe('profileService authentication & error resilience', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('isUnauthorizedError', () => {
    it('returns true when response status is 401', () => {
      const err = { response: { status: 401 } };
      expect(isUnauthorizedError(err)).toBe(true);
    });

    it('returns true when status property is 401', () => {
      const err = { status: 401 };
      expect(isUnauthorizedError(err)).toBe(true);
    });

    it('returns true when statusCode property is 401', () => {
      const err = { statusCode: 401 };
      expect(isUnauthorizedError(err)).toBe(true);
    });

    it('returns false for 500 Internal Server Error', () => {
      const err = { response: { status: 500 } };
      expect(isUnauthorizedError(err)).toBe(false);
    });

    it('returns false for 502 Bad Gateway', () => {
      const err = { response: { status: 502 } };
      expect(isUnauthorizedError(err)).toBe(false);
    });

    it('returns false for 503 Service Unavailable', () => {
      const err = { response: { status: 503 } };
      expect(isUnauthorizedError(err)).toBe(false);
    });

    it('returns false for generic/network error without 401 status', () => {
      const err = new Error('Failed to fetch');
      expect(isUnauthorizedError(err)).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(isUnauthorizedError(null)).toBe(false);
      expect(isUnauthorizedError(undefined)).toBe(false);
    });
  });

  describe('retry logic (shouldRetryProfileQuery & getProfileRetryDelay)', () => {
    it('retries non-401 errors up to 3 attempts', () => {
      const serverError = { response: { status: 502 } };
      expect(shouldRetryProfileQuery(0, serverError)).toBe(true);
      expect(shouldRetryProfileQuery(1, serverError)).toBe(true);
      expect(shouldRetryProfileQuery(2, serverError)).toBe(true);
      expect(shouldRetryProfileQuery(3, serverError)).toBe(false);
    });

    it('does not retry 401 Unauthorized errors', () => {
      const authError = { response: { status: 401 } };
      expect(shouldRetryProfileQuery(0, authError)).toBe(false);
      expect(shouldRetryProfileQuery(1, authError)).toBe(false);
    });

    it('calculates exponential backoff delay capped at 10 seconds', () => {
      expect(getProfileRetryDelay(0)).toBe(1000); // 1s
      expect(getProfileRetryDelay(1)).toBe(2000); // 2s
      expect(getProfileRetryDelay(2)).toBe(4000); // 4s
      expect(getProfileRetryDelay(3)).toBe(8000); // 8s
      expect(getProfileRetryDelay(4)).toBe(10000); // capped at 10s
    });
  });

  describe('fetchMe', () => {
    const mockUser: UserProfile = {
      id: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
      isVerifiedSeller: false,
      sellerActivatedAt: null,
      isAdmin: false,
      sellerProfile: null,
    };

    it('returns user data on successful /me response', async () => {
      (authHttp.get as jest.Mock).mockResolvedValueOnce({
        data: mockUser,
      });

      const result = await fetchMe();
      expect(result).toEqual(mockUser);
    });

    it('returns null on 401 Unauthorized error so user is treated as logged out', async () => {
      const error401 = new Error('Unauthorized');
      (error401 as any).response = { status: 401 };
      (authHttp.get as jest.Mock).mockRejectedValueOnce(error401);

      const result = await fetchMe();
      expect(result).toBeNull();
    });

    it('throws on 502 Bad Gateway so React Query can trigger retries and preserve cache', async () => {
      const error502 = new Error('Bad Gateway');
      (error502 as any).response = { status: 502 };
      (authHttp.get as jest.Mock).mockRejectedValueOnce(error502);

      await expect(fetchMe()).rejects.toThrow('Bad Gateway');
    });

    it('throws on network/fetch errors', async () => {
      (authHttp.get as jest.Mock).mockRejectedValueOnce(new Error('Network disconnected'));

      await expect(fetchMe()).rejects.toThrow('Network disconnected');
    });
  });
});
