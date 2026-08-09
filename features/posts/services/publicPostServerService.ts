import { cache } from 'react';
import { cookies } from 'next/headers';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { BackendPost } from './postsQueryService';

export const AUTH_COOKIE_KEYS = [
  'session_token',
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

export const fetchPublicPostServer = cache(async (id: string): Promise<BackendPost | null> => {
  const cookieStore = await cookies();
  const sessionCookie = AUTH_COOKIE_KEYS.reduce<
    { name: string; value: string } | undefined
  >(
    (acc, key) => acc || cookieStore.get(key),
    undefined
  );

  const headers: Record<string, string> = sessionCookie
    ? { Cookie: `${sessionCookie.name}=${sessionCookie.value}` }
    : {};

  const resResult = await Result.try(
    http.get<ApiResponse<BackendPost>>(`/seller/posts/${id}`, { headers })
  );

  if (!resResult.ok || !resResult.value) {
    return null;
  }

  const res = resResult.value;
  return res.data ?? (res as unknown as BackendPost);
});
