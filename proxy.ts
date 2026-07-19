import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { debugAuth } from './lib/utils/authDebug';

export const AUTH_COOKIE_KEYS = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

function getPresentAuthCookieNames(request: NextRequest) {
  return AUTH_COOKIE_KEYS.filter((key) => request.cookies.get(key)?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const presentAuthCookieNames = getPresentAuthCookieNames(request);
  const isLoggedIn = presentAuthCookieNames.length > 0;

  debugAuth('proxy', 'request', {
    pathname,
    origin: request.nextUrl.origin,
    isLoggedIn,
    presentAuthCookieNames,
  });

  if (pathname === '/') {
    const destination = isLoggedIn ? '/app/posts/pending' : '/auth/login';
    debugAuth('proxy', 'redirect:root', { destination, isLoggedIn });
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith('/app') && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', request.url);

    loginUrl.searchParams.set('callbackUrl', pathname);

    debugAuth('proxy', 'redirect:missingSession', {
      pathname,
      destination: loginUrl.pathname,
      callbackUrl: pathname,
    });

    return NextResponse.redirect(loginUrl);
  }

  debugAuth('proxy', 'next', { pathname, isLoggedIn });
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
  ],
};
