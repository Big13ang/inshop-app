'use client';

import MainFooter from '@/components/layout/MainFooter';
import ProfileHeader from './components/ProfileHeader';
import ProfileBioSection from './components/ProfileBioSection';
import ProfileGridFeed from './components/ProfileGridFeed';
import { type PublicSellerProfile, type SellerProfile } from '../services/profileService';

interface ProfileViewProps {
  profile?: PublicSellerProfile | SellerProfile | null;
  isOwner?: boolean;
}

export default function ProfileView({ profile, isOwner = false }: ProfileViewProps) {
  if (!profile) return null;

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <ProfileHeader username={profile.username} />

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="flex flex-col w-full">
          <ProfileBioSection sellerProfile={profile} isOwner={isOwner} />
          <ProfileGridFeed username={profile.username} />
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
