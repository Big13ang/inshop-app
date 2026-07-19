import { cookies } from 'next/headers';
import { http, Result } from '@/lib/utils';
import { AUTH_COOKIE_KEYS } from '@/proxy';
import type { UserProfile } from './profileService';
import { debugAuth } from '@/lib/utils/authDebug';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function getServerProfile(): Promise<UserProfile | null> {
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
    http.get<UserProfile>('/me', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    })
  );

  if (!resResult.ok) {
    debugAuth('profile', 'serverProfile:requestError', {
      errorMessage: getErrorMessage(resResult.error),
    });
    console.error('Error executing profile request on server:', resResult.error);
    return null;
  }

  const res = resResult.value;
  if (!res.ok) {
    debugAuth('profile', 'serverProfile:notAuthenticated', {
      status: res.error.status,
      errorMessage: res.error.message,
    });
    return null;
  }

  debugAuth('profile', 'serverProfile:success', {
    hasUser: true,
  });

  return res.value;
}
