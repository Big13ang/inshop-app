import { proxy } from '../proxy';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: jest.fn((url) => ({ status: 307, headers: { Location: url.toString() }, url })),
      next: jest.fn(() => ({ status: 200 })),
    },
  };
});

describe('Next.js proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('root path /', () => {
    it('redirects to /auth/login if session token is missing', () => {
      const mockRequest = {
        url: 'http://localhost:4000/',
        nextUrl: {
          pathname: '/',
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectedUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectedUrl.pathname).toBe('/auth/login');
    });

    it('redirects to /app/posts/pending if session token is present', () => {
      const mockRequest = {
        url: 'http://localhost:4000/',
        nextUrl: {
          pathname: '/',
        },
        cookies: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'better-auth.session_token') {
              return { value: 'valid-token' };
            }
            return undefined;
          }),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectedUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectedUrl.pathname).toBe('/app/profile');
    });
  });

  describe('auth paths', () => {
    it('redirects to /app/posts/pending if session token is present when accessing /auth/login', () => {
      const mockRequest = {
        url: 'http://localhost:4000/auth/login',
        nextUrl: {
          pathname: '/auth/login',
        },
        cookies: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'better-auth.session_token') {
              return { value: 'valid-token' };
            }
            return undefined;
          }),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectedUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectedUrl.pathname).toBe('/app/profile');
    });

    it('redirects to /app/posts/pending if session token is present when accessing /auth/otp', () => {
      const mockRequest = {
        url: 'http://localhost:4000/auth/otp?phone=09123456789',
        nextUrl: {
          pathname: '/auth/otp',
        },
        cookies: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'better-auth.session_token') {
              return { value: 'valid-token' };
            }
            return undefined;
          }),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectedUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectedUrl.pathname).toBe('/app/profile');
    });

    it('allows request to proceed if session token is missing when accessing /auth/login', () => {
      const mockRequest = {
        url: 'http://localhost:4000/auth/login',
        nextUrl: {
          pathname: '/auth/login',
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
