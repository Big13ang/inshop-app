'use client';

import { useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import MainFooter from '@/components/layout/MainFooter';
import { profileService } from '../services/profileService';

import ProfileHeader from './components/ProfileHeader';
import ProfileBioSection from './components/ProfileBioSection';
import ProfileGridFeed from './components/ProfileGridFeed';
import { PROFILE_ROUTES } from '../constants';
import { ProfileOverviewSkeleton } from '../components/ProfileSkeleton';

interface ProfileViewProps {
  /** Optional target handle username for public profile routing (e.g. "shik_show") */
  targetUsername?: string;
}

export default function ProfileView({ targetUsername }: ProfileViewProps) {
  const router = useRouter();
  const { data: me, isLoading: isMeLoading } = profileService.useMe();

  const cleanTarget = targetUsername?.trim();
  const effectiveUsername = cleanTarget || me?.sellerProfile?.username;

  const { data: userProfile, isLoading: isUserProfileLoading } = profileService.useUserProfile(
    effectiveUsername,
    { enabled: Boolean(effectiveUsername) }
  );

  const isMissingSellerProfile = !cleanTarget && me != null && me.sellerProfile == null;

  useEffect(() => {
    if (isMissingSellerProfile) {
      router.replace(PROFILE_ROUTES.edit);
    }
  }, [isMissingSellerProfile, router]);

  const sellerProfile = userProfile ?? me?.sellerProfile ?? undefined;

  const isLoading = isUserProfileLoading || (!cleanTarget && isMeLoading);

  if (isLoading) return <ProfileOverviewSkeleton />;

  if (!cleanTarget && (!me || !me.sellerProfile)) {
    return null;
  }

  if (cleanTarget && !isUserProfileLoading && !userProfile) {
    notFound();
  }

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <ProfileHeader username={sellerProfile?.username || effectiveUsername} />

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="flex flex-col w-full">
          <ProfileBioSection sellerProfile={sellerProfile} />
          <ProfileGridFeed username={sellerProfile?.username || effectiveUsername} />
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
