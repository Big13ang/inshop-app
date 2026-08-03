import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);
  const isApp = pathname.startsWith('/app');

  if (isApp && !session) {
    // TEMPORARY (test): disabled to isolate which redirect is bouncing
    // users to /auth/login right after login. Revert once confirmed.
    // return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
