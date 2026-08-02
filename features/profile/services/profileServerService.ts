import { cookies } from 'next/headers';
import { http, Result } from '@/lib/utils';
import type { UserMe } from './profileService';
import { debugAuth } from '@/lib/utils/authDebug';

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
    http.get<UserMe>('/me', {
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

  return resResult.value;
}
