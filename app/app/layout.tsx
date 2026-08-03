'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/features/profile/context/UserContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useUser();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoggedIn, router]);

  return children;
}
