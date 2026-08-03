'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/features/profile/context/UserContext';
import type { UserProfile } from '@/features/profile/services/profileService';

function redirectUser(user: UserProfile | null, router: ReturnType<typeof useRouter>) {
  if (!user) {
    router.replace('/auth/login');
  } else if (user.sellerProfile == null) {
    router.replace('/app/profile/edit');
  } else {
    router.replace('/app/profile');
  }
}

export default function Home() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    redirectUser(user, router);
  }, [user, router]);

  return null;
}
