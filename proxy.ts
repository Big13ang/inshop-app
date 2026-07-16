import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!(
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value
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
