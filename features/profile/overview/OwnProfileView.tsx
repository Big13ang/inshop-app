'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainFooter from '@/components/layout/MainFooter';
import { ProfileView } from './ProfileView';
import { useUser } from '../context/UserContext';
import { PROFILE_ROUTES } from '../constants';
import { UserAccountView } from './components/UserAccountView';
import { ProfileHeader } from './components/ProfileHeader';
import { UserAccountTabSwitcher, type ProfileOverviewTab } from './components/UserAccountTabSwitcher';
import { UnverifiedSellerView } from '../unverified/UnverifiedSellerView';

export function OwnProfileView() {
  const { user: me, isVerifying } = useUser();
  const router = useRouter();
  const [nonSellerTab, setNonSellerTab] = useState<ProfileOverviewTab>('account');

  useEffect(() => {
    if (isVerifying || !me) return;

    if (me.isVerifiedSeller && !me.sellerProfile) {
      router.replace(PROFILE_ROUTES.edit);
    }
  }, [me, isVerifying, router]);

  if (isVerifying || !me) {
    return null;
  }

  // 1. Seller condition: show the current page we have
  if (me.isVerifiedSeller) {
    if (!me.sellerProfile) {
      return null;
    }
    return <ProfileView profile={me.sellerProfile} isOwner={true} />;
  }

  // 2. Non-seller condition:
  // If non-seller switched to "پروفایل فروشگاه", show store tab with unverified seller status
  if (nonSellerTab === 'seller') {
    return (
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
        <ProfileHeader title="پروفایل فروشگاه" isOwner={true} showAddPost={false} />
        <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
          <div className="px-4 pt-4">
            <UserAccountTabSwitcher activeTab="seller" onTabChange={setNonSellerTab} />
          </div>
          <UnverifiedSellerView />
        </main>
        <MainFooter />
      </div>
    );
  }

  // Default non-seller view: User Account Profile
  return (
    <UserAccountView
      user={me}
      activeTab="account"
      onTabChange={setNonSellerTab}
    />
  );
}
