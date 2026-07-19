import { cookies } from 'next/headers';
import { http, Result } from '@/lib/utils';
import { AUTH_COOKIE_KEYS } from '@/proxy';
import type { UserProfile } from './profileService';

export async function getServerProfile(): Promise<UserProfile | null> {
  const cookieStore = await cookies();

  const sessionCookie = AUTH_COOKIE_KEYS.reduce<
    { name: string; value: string } | undefined
  >(
    (acc, key) => acc || cookieStore.get(key),
    undefined
  );

  if (!sessionCookie) {
    return null;
  }

  const resResult = await Result.try(
    http.get<UserProfile>('/me', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
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
