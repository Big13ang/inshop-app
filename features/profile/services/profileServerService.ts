import { cache } from 'react';
import { cookies } from 'next/headers';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { UserMe } from './profileService';
import type { SellerPostsByUsernameData } from '@/features/posts/services/postsQueryService';
import { debugAuth } from '@/lib/utils/authDebug';

export const getPublicSellerProfile = cache(
  async (username: string): Promise<SellerPostsByUsernameData | null> => {
    const trimmed = (username || '').trim();
    if (!trimmed) return null;

    const resResult = await Result.try(
      http.get<ApiResponse<SellerPostsByUsernameData>>(
        `/posts/seller/username/${encodeURIComponent(trimmed)}`
      )
    );

    if (!resResult.ok || !resResult.value?.data) {
      if (!resResult.ok) {
        console.warn(`[getPublicSellerProfile] Server fetch failed for "${trimmed}":`, resResult.error);
      }
      return null;
    }

    return resResult.value.data;
  }
);

export const AUTH_COOKIE_KEYS = [
  'session_token',
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function getServerProfile(): Promise<UserMe | null> {
  const cookieStore = await cookies();

  const sessionCookie = AUTH_COOKIE_KEYS.reduce<
    { name: string; value: string } | undefined
  >(
    (acc, key) => acc || cookieStore.get(key),
    undefined
  );

  if (!sessionCookie) {
    debugAuth('profile', 'serverProfile:noSessionCookie', {
      checkedCookieNames: [...AUTH_COOKIE_KEYS],
    });
    return null;
  }

  debugAuth('profile', 'serverProfile:requestMe', {
    cookieName: sessionCookie.name,
  });

  const resResult = await Result.try(
    http.get<ApiResponse<UserMe>>('/me', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    })
  );

  if (!resResult.ok) {
    debugAuth('profile', 'serverProfile:requestError', {
      errorMessage: getErrorMessage(resResult.error),
    });
    return null;
  }

  debugAuth('profile', 'serverProfile:success', {
    hasUser: true,
  });

  return resResult.value.data;
}
