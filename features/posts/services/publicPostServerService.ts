import { cacheLife, cacheTag } from 'next/cache';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { PublicPost } from './publicPostService';

export async function fetchPublicPostServer(id: string): Promise<PublicPost | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`post-${id}`);

  const resResult = await Result.try(() =>
    http.get<ApiResponse<PublicPost>>(`/posts/${id}`, {
      timeout: 4000,
      retry: 1,
    })
  );

  if (!resResult.ok || !resResult.value?.data) {
    if (!resResult.ok) {
      console.warn(`[fetchPublicPostServer] Failed to fetch post ${id}:`, resResult.error);
    }
    return null;
  }

  return resResult.value.data;
}