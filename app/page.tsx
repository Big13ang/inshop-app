'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    router.replace(session ? '/app/profile' : '/auth/login');
  }, [session, isPending, router]);

  return null;
}
