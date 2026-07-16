import { cookies } from 'next/headers';
import { http, Result } from '@/lib/utils';
import { AUTH_COOKIE_KEYS } from '@/proxy';
import type { UserProfile } from './profileService';

export async function getServerProfile(): Promise<UserProfile | null> {
  const cookieResult = await Result.try(cookies());
  if (!cookieResult.ok) {
    console.error('Error reading cookies on server:', cookieResult.error);
    return null;
  }
  const cookieStore = cookieResult.value;

  const sessionToken = AUTH_COOKIE_KEYS.reduce<string | undefined>(
    (acc, key) => acc || cookieStore.get(key)?.value,
    undefined
  );

  if (!sessionToken) {
    return null;
  }

  const resResult = await Result.try(
    http.get<UserProfile>('/me', {
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
      },
    })
  );

  if (!resResult.ok) {
    console.error('Error executing profile request on server:', resResult.error);
    return null;
  }

  const res = resResult.value;
  if (!res.ok) {
    return null;
  }

  return res.value;
}
