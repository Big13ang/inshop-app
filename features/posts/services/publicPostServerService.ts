import { cacheLife, cacheTag } from 'next/cache';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { PublicPost } from './publicPostService';

export async function fetchPublicPostServer(id: string): Promise<PublicPost | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`post-${id}`);

  const resResult = await Result.try(() =>
    http.get<ApiResponse<PublicPost>>(`/posts/${id}`)
  );

  if (!resResult.ok || !resResult.value?.data) {
    return null;
  }

  return resResult.value.data;
}