import type { NextRequest, NextResponse } from 'next/server';
import { resolveProxyResponse } from '@/lib/proxy/resolveProxyResponse';

export function proxy(request: NextRequest): Promise<NextResponse> {
  return resolveProxyResponse(request);
}

export const config = {
  matcher: [
    { source: '/p/:id' },
    {
      source: '/((?!api|_next/static|_next/image|favicon|fonts|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
      missing: [{ type: 'cookie', key: 'inshop_cache_reset', value: 'v1' }],
    },
  ],
};
