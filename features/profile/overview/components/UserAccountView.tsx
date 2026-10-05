'use client';

import { useRouter } from 'next/navigation';
import MainFooter from '@/components/layout/MainFooter';
import { PROFILE_ROUTES } from '../../constants';
import type { UserMe } from '../../services/profileService';
import { ProfileHeader } from './ProfileHeader';
import { UserAccountTabSwitcher, type ProfileOverviewTab } from './UserAccountTabSwitcher';
// import { UserStatsBar } from './UserStatsBar';
import { UserBioInfo } from './UserBioInfo';
import { UserAddressesBanner } from './UserAddressesBanner';
import { UserViewedPostsGrid } from './UserViewedPostsGrid';

export interface UserAccountViewProps {
  user: UserMe;
  activeTab?: ProfileOverviewTab;
  onTabChange?: (tab: ProfileOverviewTab) => void;
}

export function UserAccountView({
  user,
  activeTab = 'account',
  onTabChange,
}: UserAccountViewProps) {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push(PROFILE_ROUTES.edit);
  };

  const handleTabChange = (tab: ProfileOverviewTab) => {
    onTabChange?.(tab);
  };

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <ProfileHeader
        username={user.sellerProfile?.username}
        title={user.sellerProfile?.username ? undefined : 'حساب کاربری'}
        isOwner={true}
        showAddPost={user.isVerifiedSeller}
      />

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="flex flex-col w-full">
          {/* Top Section: مشخصات کاربر و آمار */}
          <div className="px-4 pt-4 flex flex-col pb-4">
            {/* 1. Role Switcher Pill: حساب کاربری / پروفایل فروشگاه */}
            <UserAccountTabSwitcher
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {/* 2. User Stats Row (Commented out for now) */}
            {/* <UserStatsBar
              viewedCount={viewedCount}
              bookmarkedCount={0}
              ordersCount={0}
            /> */}

            {/* 3. User Bio Info */}
            <UserBioInfo user={user} onEditProfile={handleEditProfile} />

            {/* 4. Addresses Banner Card */}
            <UserAddressesBanner />
          </div>

          {/* Bottom Section: 3-Column Viewed Posts Grid with Infinite Scrolling */}
          <UserViewedPostsGrid />
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
