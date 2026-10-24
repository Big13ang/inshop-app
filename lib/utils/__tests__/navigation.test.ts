import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { goBackSafely, getIsInternal, setIsInternal, getLoginUrlWithCallback, getSafeCallbackUrl } from '../navigation';

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

  describe('getSafeCallbackUrl', () => {
    it.each([
      null,
      undefined,
      '',
      'https://evil.example',
      'http://evil.example/x',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'data:text/html,x',
      '  /app',
      '/app\n/x',
      '/auth/login',
    ])('falls back to /app/profile for unsafe value %p', (raw) => {
      expect(getSafeCallbackUrl(raw)).toBe('/app/profile');
    });

    it.each(['/app/profile', '/app/posts/new', '/p/123?ref=feed#top', '/@shop_name', '/authors'])(
      'keeps same-origin path %p unchanged',
      (raw) => {
        expect(getSafeCallbackUrl(raw)).toBe(raw);
      }
    );

    it('accepts an absolute URL on the current origin, whether localhost or a deployed host', () => {
      expect(getSafeCallbackUrl(`${window.location.origin}/app/posts/new?draft=1`)).toBe('/app/posts/new?draft=1');
    });

    it('rejects absolute URLs on other hosts, including other app environments', () => {
      expect(getSafeCallbackUrl('https://dev.inshop.social/app/profile', '/home')).toBe('/home');
      expect(getSafeCallbackUrl('https://inshop.social/app/profile', '/home')).toBe('/home');
    });

    it('uses the provided fallback when the value is unsafe', () => {
      expect(getSafeCallbackUrl('https://evil.example', '/home')).toBe('/home');
    });
  });
});

