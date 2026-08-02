'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { profileService } from '@/features/profile/services/profileService';

export default function Home() {
  const router = useRouter();

  const { data: user, isLoading } = profileService.useMe();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? '/app/profile' : '/auth/login');
  }, [user, isLoading, router]);

  return null;
}
