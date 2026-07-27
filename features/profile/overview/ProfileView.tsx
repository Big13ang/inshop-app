'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MainFooter from '@/components/layout/MainFooter';
import { postsQueryService, POST_STATUS } from '@/features/posts/services/postsQueryService';
import { profileService } from '../services/profileService';
import { PROFILE_ROUTES, text } from '../constants';

import { getMediaUrl } from '@/features/posts/utils/media';
import ProfileHeader from './components/ProfileHeader';
import ProfileBioSection from './components/ProfileBioSection';
import ProfileGridFeed from './components/ProfileGridFeed';
import ProfileDetailFeed from './components/ProfileDetailFeed';
import PostSettingsDrawer from './components/PostSettingsDrawer';

export default function ProfileView() {
  const router = useRouter();
  const { data: user, isLoading } = profileService.useUserProfile();
  const sellerProfile = user?.sellerProfile;
  const hasProfile = Boolean(
    user?.username ||
    user?.shopName ||
    sellerProfile?.id ||
    sellerProfile?.username
  );

  useEffect(() => {
    if (!isLoading && user && !hasProfile) {
      toast.info('لطفا ابتدا اطلاعات پروفایل خود را تکمیل کنید');
      router.replace(PROFILE_ROUTES.edit);
    }
  }, [isLoading, user, hasProfile, router]);

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

  const deletePostMutation = postsQueryService.useDeletePendingPost();

  const [clickedPostId, setClickedPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());

  const shopName = user?.shopName || sellerProfile?.shopName || text.overview.fallbackShopName;
  const handle = user?.username || sellerProfile?.username || text.overview.fallbackHandle;
  const phoneNumber = user?.phones?.[0]?.phoneNumber || sellerProfile?.phones?.[0]?.phoneNumber || '';
  const address = (user?.address || sellerProfile?.address || '').trim();
  const showAddress = Boolean(address) && (user?.addressShow ?? sellerProfile?.addressShow ?? true) !== false;
  const bio = user?.bio || sellerProfile?.bio || '';
  const avatar = user?.profilePhotoUrl || sellerProfile?.profilePhotoUrl || user?.avatarUrl || '';

  const formattedPosts = approvedPosts.map((p) => ({
    id: String(p.id),
    shopName,
    sellerName: shopName,
    sellerAvatar: avatar,
    caption: p.description || '',
    images: p.media ? p.media.map((m) => getMediaUrl(m)).filter(Boolean) : [],
    media: p.media,
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
    const storeUrl = `https://inshop.ir/store/${handle}`;
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
    avatar,
    handleId: handle,
    bio,
    address,
    showAddress,
    phone: phoneNumber,
    isVerified: !!user?.isVerifiedSeller,
  };

  if (!hasProfile) {
    return null;
  }

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
        onDeletePost={(id) => deletePostMutation.mutate(id)}
      />

      <MainFooter />
    </div>
  );
}
