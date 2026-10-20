import { NextResponse, type NextRequest } from 'next/server';
import { isMissingPostForCrawler } from '@/features/posts/services/crawlerPostStatus';

// Bump this to make every browser drop its HTTP cache once more on its next page load.
const CACHE_RESET_VERSION = 'v1';
const CACHE_RESET_COOKIE = 'inshop_cache_reset';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function resolveProxyResponse(request: NextRequest): Promise<NextResponse> {
  if (await isMissingPostForCrawler(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.next();
  const isPageLoad = request.headers.get('sec-fetch-dest') === 'document';
  const alreadyReset = request.cookies.get(CACHE_RESET_COOKIE)?.value === CACHE_RESET_VERSION;
  if (!isPageLoad || alreadyReset) return response;

  response.headers.set('Clear-Site-Data', '"cache"');
  // This response is user-specific, so the CDN must never store it.
  response.headers.set('Cache-Control', 'private, no-store');
  response.cookies.set(CACHE_RESET_COOKIE, CACHE_RESET_VERSION, {
    path: '/',
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
  });
  return response;
}
