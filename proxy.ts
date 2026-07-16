import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_KEYS = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = AUTH_COOKIE_KEYS.some(
    (key) => request.cookies.get(key)?.value
  );

  if (pathname === '/') {
    const destination = isLoggedIn ? '/app/posts/pending' : '/auth/login';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith('/app') && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', request.url);

    loginUrl.searchParams.set('callbackUrl', pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
  ],
};
