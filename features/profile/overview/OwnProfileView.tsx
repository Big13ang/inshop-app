'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileView from './ProfileView';
import { useUser } from '../context/UserContext';
import { PROFILE_ROUTES } from '../constants';

export default function OwnProfileView() {
  const { user: me, isVerifying } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isVerifying || !me) return;

    if (!me.isVerifiedSeller) {
      router.replace(PROFILE_ROUTES.unverified);
    } else if (!me.sellerProfile) {
      router.replace(PROFILE_ROUTES.edit);
    }
  }, [me, isVerifying, router]);

  if (isVerifying || !me || !me.isVerifiedSeller || !me.sellerProfile) {
    return null;
  }

  return <ProfileView profile={me.sellerProfile} isOwner={true} />;
}
