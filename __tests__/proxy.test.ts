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
      expect(redirectedUrl.pathname).toBe('/app/posts/pending');
    });
  });

  describe('app paths', () => {
    it('redirects to /auth/login with callbackUrl if session token is missing', () => {
      const mockRequest = {
        url: 'http://localhost:4000/app/posts/new',
        nextUrl: {
          pathname: '/app/posts/new',
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(mockRequest.cookies.get).toHaveBeenCalledWith('better-auth.session_token');
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('__Secure-better-auth.session_token');
      expect(NextResponse.redirect).toHaveBeenCalled();
      
      const redirectedUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectedUrl.pathname).toBe('/auth/login');
      expect(redirectedUrl.searchParams.get('callbackUrl')).toBe('/app/posts/new');
    });

    it('allows request to proceed if better-auth.session_token is present', () => {
      const mockRequest = {
        url: 'http://localhost:4000/app/posts/new',
        nextUrl: {
          pathname: '/app/posts/new',
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

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('allows request to proceed if __Secure-better-auth.session_token is present', () => {
      const mockRequest = {
        url: 'http://localhost:4000/app/posts/new',
        nextUrl: {
          pathname: '/app/posts/new',
        },
        cookies: {
          get: jest.fn().mockImplementation((name) => {
            if (name === '__Secure-better-auth.session_token') {
              return { value: 'secure-token' };
            }
            return undefined;
          }),
          getAll: jest.fn().mockReturnValue([]),
        },
      } as unknown as NextRequest;

      proxy(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
