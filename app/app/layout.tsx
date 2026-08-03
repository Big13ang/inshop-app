'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/features/profile/context/UserContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, isVerifying } = useUser();

  useEffect(() => {
    // Wait for the client-side /me refetch to settle before redirecting.
    // isLoggedIn on first render can reflect a stale/incorrect SSR cookie
    // check; redirecting on that alone bounces users who are actually
    // logged in right after login/reset/signup.
    if (!isVerifying && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoggedIn, isVerifying, router]);

  return children;
}
