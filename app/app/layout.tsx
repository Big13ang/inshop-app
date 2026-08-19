'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/features/profile/context/UserContext';
import { getLoginUrlWithCallback } from '@/lib/utils/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isVerifying } = useUser();

  useEffect(() => {
    // Wait for the client-side /me refetch to settle before redirecting.
    // isLoggedIn on first render can reflect a stale/incorrect SSR cookie
    // check; redirecting on that alone bounces users who are actually
    // logged in right after login/reset/signup.
    if (!isVerifying && !isLoggedIn) {
      router.replace(getLoginUrlWithCallback(pathname));
    }
  }, [isLoggedIn, isVerifying, pathname, router]);

  return children;
}

