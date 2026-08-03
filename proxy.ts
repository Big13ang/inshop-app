import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);
  const isAuth = pathname.startsWith('/auth');
  const isApp = pathname.startsWith('/app');
  const isHome = pathname === '/';

  if ((isApp || isHome) && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if ((isAuth || isHome) && session) {
    return NextResponse.redirect(new URL('/app/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/app/:path*', '/auth/:path*'],
};
