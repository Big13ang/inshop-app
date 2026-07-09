import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  console.log("PROXY REQUEST URL:", request.url);
  console.log("PROXY COOKIES:", request.cookies.getAll().map(c => `${c.name}=${c.value}`));
  const sessionToken = request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/auth/login', request.url);
    // Option to redirect back to the original page after successful login
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
  ],
};
