import { proxy } from '../proxy';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url) => ({ status: 307, headers: { Location: url.toString() }, url })),
    next: jest.fn(() => ({ status: 200 })),
  },
}));

jest.mock('better-auth/cookies', () => ({
  getSessionCookie: jest.fn(),
}));

import { getSessionCookie } from 'better-auth/cookies';

function makeRequest(url: string, pathname: string): NextRequest {
  return { url, nextUrl: { pathname }, headers: new Headers() } as unknown as NextRequest;
}

describe('proxy', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('/app/* paths', () => {
    it('redirects to /auth/login if no session', () => {
      (getSessionCookie as jest.Mock).mockReturnValue(null);
      proxy(makeRequest('http://localhost:4000/app/profile', '/app/profile'));

      expect(NextResponse.redirect).toHaveBeenCalled();
      const url = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(url.pathname).toBe('/auth/login');
    });

    it('proceeds if session is present', () => {
      (getSessionCookie as jest.Mock).mockReturnValue('valid-token');
      proxy(makeRequest('http://localhost:4000/app/profile', '/app/profile'));

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('/auth/* paths', () => {
    it('redirects to /app/profile if session present on /auth/login', () => {
      (getSessionCookie as jest.Mock).mockReturnValue('valid-token');
      proxy(makeRequest('http://localhost:4000/auth/login', '/auth/login'));

      expect(NextResponse.redirect).toHaveBeenCalled();
      const url = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(url.pathname).toBe('/app/profile');
    });

    it('redirects to /app/profile if session present on /auth/otp', () => {
      (getSessionCookie as jest.Mock).mockReturnValue('valid-token');
      proxy(makeRequest('http://localhost:4000/auth/otp', '/auth/otp'));

      expect(NextResponse.redirect).toHaveBeenCalled();
      const url = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(url.pathname).toBe('/app/profile');
    });

    it('proceeds if no session on /auth/login', () => {
      (getSessionCookie as jest.Mock).mockReturnValue(null);
      proxy(makeRequest('http://localhost:4000/auth/login', '/auth/login'));

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
