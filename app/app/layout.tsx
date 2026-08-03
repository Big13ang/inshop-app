'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/features/profile/context/UserContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useUser();

  useEffect(() => {
    // Disabled: this fired on isLoggedIn=false from any stale/transient query
    // state (including right after login/reset/signup success), redirecting
    // users back to /auth/login even when they were actually authenticated.
    // Redirecting to login should only happen on an actual 401 from the API.
    // if (!isLoggedIn) {
    //   router.replace('/auth/login');
    // }
  }, [isLoggedIn, router]);

  return children;
}
