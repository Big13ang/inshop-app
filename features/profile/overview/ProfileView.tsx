'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MainFooter from '@/components/layout/MainFooter';
import { postsQueryService, POST_STATUS } from '@/features/posts/services/postsQueryService';
import { useUser } from '../context/UserContext';
import { PROFILE_ROUTES, text } from '../constants';
import {
  getHandle,
  getPhoneNumber,
  getShopName,
  getStoreUrl,
  isAddressVisible,
} from '../utils/profileMapper';

import ProfileHeader from './components/ProfileHeader';
import ProfileBioSection from './components/ProfileBioSection';
import ProfileGridFeed from './components/ProfileGridFeed';
import ProfileDetailFeed from './components/ProfileDetailFeed';
import PostSettingsDrawer from './components/PostSettingsDrawer';

export default function ProfileView() {
  const router = useRouter();
  const { user } = useUser();

  const {
    data: approvedInfiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = postsQueryService.useInfiniteSellerPostsByStatus(POST_STATUS.APPROVED);

  const approvedPosts = approvedInfiniteData
    ? approvedInfiniteData.pages.flatMap((page) => page.data)
    : [];

  const { data: pendingPosts = [] } = postsQueryService.useSellerPostsByStatus(
    POST_STATUS.PENDING_REVIEW,
  );
  const { data: rejectedPosts = [] } = postsQueryService.useSellerPostsByStatus(
    POST_STATUS.REJECTED,
  );

  const [clickedPostId, setClickedPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());

  const shopName = getShopName(user);
  const handle = getHandle(user);
  const phoneNumber = getPhoneNumber(user);
  const address = user?.businessData?.address?.trim() ?? '';
  const showAddress = isAddressVisible(user);

  const formattedPosts = approvedPosts.map((p) => ({
    id: String(p.id),
    shopName,
    sellerName: shopName,
    sellerAvatar: user?.avatarUrl || '',
    caption: p.description || '',
    images: p.media ? p.media.map((m) => m.url ?? '').filter(Boolean) : [],
    isBookmarked: bookmarkedSet.has(String(p.id)),
    isVerified: !!user?.isVerifiedSeller,
  }));

  const handleEdit = () => {
    router.push(PROFILE_ROUTES.edit);
  };

  const handleAddPost = () => {
    router.push(PROFILE_ROUTES.newPost);
  };

  const handleNavigatePending = () => {
    router.push(PROFILE_ROUTES.pendingPosts);
  };


  const handleCall = () => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
      return;
    }
    toast.error(text.overview.callUnavailable);
  };

  const handleShare = async () => {
    const storeUrl = getStoreUrl(handle);
    try {
      await navigator.clipboard.writeText(storeUrl);
      toast.success(text.overview.shareCopied);
    } catch {
      toast.error(text.overview.shareFailed);
    }
  };

  const handleBookmarkToggle = (id: string) => {
    setBookmarkedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleHeaderBack = () => {
    if (clickedPostId) {
      setClickedPostId(null);
    } else {
      router.back();
    }
  };

  const activeMenuPost = formattedPosts.find((p) => p.id === activeMenuPostId) || null;

  const shopProfileData = {
    name: shopName,
    avatar: user?.avatarUrl || '',
    handleId: handle,
    bio: user?.businessData?.bio ?? '',
    address,
    showAddress,
    phone: phoneNumber,
    isVerified: !!user?.isVerifiedSeller,
  };

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      {/* Header */}
      <ProfileHeader
        handleId={handle}
        hasClickedPost={!!clickedPostId}
        onBack={handleHeaderBack}
        isVerified={!!user?.isVerifiedSeller}
      />

      {/* Main Content */}
      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        {!clickedPostId ? (
          <div className="flex flex-col w-full">
            <ProfileBioSection
              shopProfile={shopProfileData}
              publishedCount={approvedPosts.length}
              pendingCount={pendingPosts.length}
              rejectedCount={rejectedPosts.length}
              onCall={handleCall}
              onShare={handleShare}
              onEditProfile={handleEdit}
              onNavigatePending={handleNavigatePending}
            />
            <ProfileGridFeed
              posts={formattedPosts}
              onPostClick={setClickedPostId}
              onAddPost={handleAddPost}
              onLoadMore={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        ) : (
          <ProfileDetailFeed
            posts={formattedPosts}
            clickedPostId={clickedPostId}
            onClose={() => setClickedPostId(null)}
            onCall={handleCall}
            onShare={(id) => {
              navigator.clipboard.writeText(`https://inshop.ir/post/${id}`).then(() => {
                toast.success('لینک پست کپی شد! 📋');
              });
            }}
            onBookmark={handleBookmarkToggle}
            onOpenMenu={setActiveMenuPostId}
          />
        )}
      </main>

      {/* Post Settings Drawer */}
      <PostSettingsDrawer
        post={activeMenuPost}
        onClose={() => setActiveMenuPostId(null)}
        onBookmarkToggle={handleBookmarkToggle}
      />

      <MainFooter />
    </div>
  );
}
