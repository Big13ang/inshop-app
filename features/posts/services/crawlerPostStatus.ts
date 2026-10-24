import { HTTPError } from 'ky';
import type { NextRequest } from 'next/server';
import { http } from '@/lib/utils/http';
import { Result } from '@/lib/utils/result';
import { isCrawlerUserAgent } from '@/lib/utils/crawler';

/** True only when a crawler asks for a post that the backend confirms does not exist. */
export async function isMissingPostForCrawler(request: NextRequest): Promise<boolean> {
  const postId = request.nextUrl.pathname.match(/^\/p\/([^/]+)$/)?.[1];
  const userAgent = request.headers.get('user-agent') ?? '';
  if (!postId || !isCrawlerUserAgent(userAgent)) return false;

  const result = await Result.try(http.get(`/posts/${postId}`, { timeout: 4000 }));
  return !result.ok && result.error instanceof HTTPError && result.error.response.status === 404;
}
