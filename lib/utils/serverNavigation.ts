import { headers } from 'next/headers';

/**
 * Determines whether the current Server Component request originates from an
 * in-app client-side navigation (indicated by the `RSC: 1` header sent by Next.js router).
 *
 * Useful for bypassing redundant server-side database/API queries when the client
 * already holds the data in its TanStack Query cache.
 */
export async function isClientNavigation(): Promise<boolean> {
  const headerList = await headers();
  return headerList.get('rsc') === '1';
}
