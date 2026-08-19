import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { goBackSafely, getIsInternal, setIsInternal, getLoginUrlWithCallback } from '../navigation';

describe('navigation utility', () => {
  let mockRouter: { back: jest.Mock; replace: jest.Mock };

  beforeEach(() => {
    mockRouter = {
      back: jest.fn(),
      replace: jest.fn(),
    };
  });

  describe('automatic history tracking', () => {
    it('sets isInternal to true when pushState is called', () => {
      setIsInternal(false);
      expect(getIsInternal()).toBe(false);
      window.history.pushState({}, '', '/test-url-1');
      expect(getIsInternal()).toBe(true);
    });
  });

  describe('goBackSafely', () => {
    it('calls router.replace("/") if not internal', () => {
      setIsInternal(false);
      goBackSafely(mockRouter as unknown as AppRouterInstance);
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
      expect(mockRouter.back).not.toHaveBeenCalled();
    });

    it('calls router.back() if internal', () => {
      setIsInternal(true);
      goBackSafely(mockRouter as unknown as AppRouterInstance);
      expect(mockRouter.back).toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('getLoginUrlWithCallback', () => {
    it('returns default login URL when targetUrl is null, undefined, or empty', () => {
      expect(getLoginUrlWithCallback()).toBe('/auth/login');
      expect(getLoginUrlWithCallback(null)).toBe('/auth/login');
      expect(getLoginUrlWithCallback('')).toBe('/auth/login');
    });

    it('returns default login URL when targetUrl starts with /auth', () => {
      expect(getLoginUrlWithCallback('/auth/login')).toBe('/auth/login');
      expect(getLoginUrlWithCallback('/auth/otp')).toBe('/auth/login');
    });

    it('appends URI-encoded callbackUrl when a valid target path is provided', () => {
      expect(getLoginUrlWithCallback('/app/profile')).toBe('/auth/login?callbackUrl=%2Fapp%2Fprofile');
      expect(getLoginUrlWithCallback('/app/posts/new?draft=1')).toBe('/auth/login?callbackUrl=%2Fapp%2Fposts%2Fnew%3Fdraft%3D1');
    });
  });
});

