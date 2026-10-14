import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Bump this value to force every browser to drop its HTTP cache for the site
// once more on its next page load.
const CACHE_RESET_VERSION = 'v1';
const CACHE_RESET_COOKIE = 'inshop_cache_reset';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function isDocumentNavigation(request: NextRequest): boolean {
  return request.headers.get('sec-fetch-dest') === 'document';
}

export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const alreadyReset = request.cookies.get(CACHE_RESET_COOKIE)?.value === CACHE_RESET_VERSION;
  if (alreadyReset || !isDocumentNavigation(request)) return response;

  response.headers.set('Clear-Site-Data', '"cache"');
  // This response is user-specific, so the CDN must never store it.
  response.headers.set('Cache-Control', 'private, no-store');
  response.cookies.set({
    name: CACHE_RESET_COOKIE,
    value: CACHE_RESET_VERSION,
    path: '/',
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon|fonts|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
      missing: [{ type: 'cookie', key: 'inshop_cache_reset', value: 'v1' }],
    },
  ],
};
