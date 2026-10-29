import { cacheLife, cacheTag } from 'next/cache';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { PublicPost } from './publicPostService';
import { PUBLIC_CONTENT_CACHE_LIFE } from '@/lib/constants/cacheLife';

export async function fetchPublicPostServer(id: string): Promise<PublicPost | null> {
  'use cache';
  cacheLife(PUBLIC_CONTENT_CACHE_LIFE);
  cacheTag(`post-${id}`);

  const resResult = await Result.try(() =>
    http.get<ApiResponse<PublicPost>>(`/posts/${id}`, {
      timeout: 4000,
      retry: 1,
    })
  );

  if (!resResult.ok) {
    const errorObj = resResult.error as { response?: { status?: number } } | undefined;
    if (errorObj?.response?.status === 404) {
      return null;
    }
    console.warn(`[fetchPublicPostServer] Transient error fetching post ${id}:`, resResult.error);
    throw resResult.error;
  }

  return resResult.value?.data ?? null;
}