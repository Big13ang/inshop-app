'use client';

import { useEffect } from 'react';
import MainFooter from '@/components/layout/MainFooter';
import { postsQueryService, POST_STATUS } from '@/features/posts/services/postsQueryService';
import { profileService } from '../services/profileService';

import ProfileHeader from './components/ProfileHeader';
import ProfileBioSection from './components/ProfileBioSection';
import ProfileGridFeed from './components/ProfileGridFeed';
import { useRouter } from 'next/navigation';
import { PROFILE_ROUTES } from '../constants';
import { ProfileOverviewSkeleton } from '../components/ProfileSkeleton';
import type { UserProfile } from '../services/profileService';

function getSellerProfile(userProfile?: UserProfile) {
  return userProfile?.sellerProfile ?? userProfile;
}

export default function ProfileView() {
  const router = useRouter();
  const { data: me } = profileService.useSuspenseMe();

  const { data: userProfile, isLoading } = profileService.useUserProfile({ enabled: me?.sellerProfile != null });

  const isMissingSellerProfile = me != null && me.sellerProfile == null;

  useEffect(() => {
    if (isMissingSellerProfile) {
      router.replace(PROFILE_ROUTES.edit);
    }
  }, [isMissingSellerProfile, router]);

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: approvedInfiniteData,
  } = postsQueryService.useInfiniteSellerPostsByStatus(POST_STATUS.APPROVED);

  const { data: pendingPosts = [] } = postsQueryService.useSellerPostsByStatus(
    POST_STATUS.PENDING_REVIEW
  );

  const approvedPosts = approvedInfiniteData
    ? approvedInfiniteData.pages.flatMap((page) => page.data)
    : [];
  const sellerProfile = getSellerProfile(userProfile);

  if (!me || !me.sellerProfile) return null;

  if (isLoading) return <ProfileOverviewSkeleton />;

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <ProfileHeader username={sellerProfile?.username || userProfile?.username} />

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="flex flex-col w-full">
          <ProfileBioSection
            sellerProfile={sellerProfile}
            publishedCount={approvedPosts.length}
            pendingCount={pendingPosts.length}
          />

          <ProfileGridFeed
            posts={approvedPosts}
            onLoadMore={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
