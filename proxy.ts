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

  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');

  if (isHome) {
    const destination = isLoggedIn ? '/app/profile' : '/auth/login';
    debugAuth('proxy', 'redirect:root', { destination, isLoggedIn });
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAuth && isLoggedIn) {
    debugAuth('proxy', 'redirect:alreadyLoggedIn', {
      pathname,
      destination: '/app/profile',
    });
    return NextResponse.redirect(new URL('/app/profile', request.url));
  }

  debugAuth('proxy', 'next', { pathname, isLoggedIn });
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
    '/auth/:path*',
  ],
};
