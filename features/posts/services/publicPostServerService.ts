import { cache } from 'react';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { PublicPost } from './publicPostService';

export type { PublicPost, PublicPostProduct, PublicPostShop, PublicPostMedia } from './publicPostService';

export const fetchPublicPostServer = cache(async (id: string): Promise<PublicPost | null> => {
  const resResult = await Result.try(() =>
    http.get<ApiResponse<PublicPost>>(`/posts/${id}`)
  );

  if (!resResult.ok || !resResult.value?.data) {
    return null;
  }

  return resResult.value.data;
});