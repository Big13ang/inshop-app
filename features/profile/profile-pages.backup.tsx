/**
 * ============================================================================
 * BACKUP FILE: Profile Pages Logic (/app/profile and /app/profile/edit)
 * ============================================================================
 * This file contains the complete original logic, UI state, handlers, form
 * structures, and components for both /app/profile/ and /app/profile/edit.
 */

// ----------------------------------------------------------------------------
// 1. SECTION: /app/profile/ (Original ProfileView)
// ----------------------------------------------------------------------------
/*
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MainFooter from '@/components/layout/MainFooter';
import { postsQueryService, POST_STATUS, type BackendMedia } from '@/features/posts/services/postsQueryService';
import { hasSellerProfile, profileService } from '../services/profileService';
import { PROFILE_ROUTES, text } from '../constants';

import { getMediaUrl } from '@/features/posts/utils/media';
import ProfileHeader from './components/ProfileHeader';
import ProfileBioSection from './components/ProfileBioSection';
import ProfileGridFeed from './components/ProfileGridFeed';
import ProfileDetailFeed from './components/ProfileDetailFeed';
import PostSettingsDrawer from './components/PostSettingsDrawer';

export default function ProfileViewBackup() {
  const router = useRouter();
  const { data: me, isLoading: isMeLoading } = profileService.useMe();
  const meHasSellerProfile = hasSellerProfile(me);
  const { data: user, isLoading: isProfileLoading } = profileService.useUserProfile({
    enabled: meHasSellerProfile,
  });
  const sellerProfile = user?.sellerProfile;
  const hasProfile = hasSellerProfile(user);

  useEffect(() => {
    if (!isMeLoading && me && !meHasSellerProfile) {
      toast.info('لطفا ابتدا اطلاعات پروفایل خود را تکمیل کنید');
      router.replace(PROFILE_ROUTES.edit);
    }
  }, [isMeLoading, me, meHasSellerProfile, router]);

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
    media: p.media?.filter((m): m is BackendMedia & { url: string } => m.url !== null),
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

  if (isMeLoading || (meHasSellerProfile && isProfileLoading)) {
    return null;
  }

  if (!meHasSellerProfile || !hasProfile) {
    return null;
  }

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <ProfileHeader
        handleId={handle}
        hasClickedPost={!!clickedPostId}
        onBack={handleHeaderBack}
        isVerified={!!user?.isVerifiedSeller}
      />

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
*/

// ----------------------------------------------------------------------------
// 2. SECTION: /app/profile/edit (Original EditProfileClientWrapper, EditProfileView & useEditProfileForm)
// ----------------------------------------------------------------------------
/*
// --- EditProfileClientWrapper ---
'use client';

import { hasSellerProfile, profileService } from '../services/profileService';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import EditProfileView from './EditProfileView';

export function EditProfileClientWrapperBackup() {
  const { data: me, isLoading: isMeLoading } = profileService.useMe();
  const meHasSellerProfile = hasSellerProfile(me);
  const { data: userProfile, isLoading: isProfileLoading } = profileService.useUserProfile({
    enabled: meHasSellerProfile,
  });

  if (isMeLoading || (meHasSellerProfile && isProfileLoading)) {
    return <ProfileEditSkeleton />;
  }

  const user = meHasSellerProfile ? userProfile : me;

  if (!user) {
    return <ProfileEditSkeleton />;
  }

  return <EditProfileView key={user.userId ?? user.id} user={user} />;
}

// --- EditProfileView ---
import { FormProvider, useWatch } from 'react-hook-form';
import Header from '@/components/layout/Header';
import type { UserProfile } from '../services/profileService';
import AvatarField from './components/AvatarField';
import ShopSection from './components/ShopSection';
import BioSection from './components/BioSection';
import AddressSection from './components/AddressSection';
import ContactSection from './components/ContactSection';
import EditProfileFooter from './components/EditProfileFooter';
import { useEditProfileForm } from './hooks/useEditProfileForm';

const FORM_ID = 'edit-profile-form';

export function EditProfileViewBackup({ user: initialUser }: { user?: UserProfile } = {}) {
  const {
    user,
    isLoading,
    form,
    isSaving,
    shopNameForAvatar,
    headerTitle,
    submitText,
    handleAvatarChange,
    handleCancel,
    handleSubmit,
  } = useEditProfileForm({ initialUser });

  if (isLoading || !user) {
    return <ProfileEditSkeleton />;
  }

  return (
    <ViewContent
      form={form}
      isSaving={isSaving}
      shopNameForAvatar={shopNameForAvatar}
      headerTitle={headerTitle}
      submitText={submitText}
      onAvatarChange={handleAvatarChange}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    />
  );
}

// --- useEditProfileForm ---
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { Result } from '@/lib/utils';
import { profileFormSchema, type ProfileFormValues } from '../../schemas/profileSchema';
import { profileMutationService } from '../../services/profileMutationService';
import { mapUserProfileToFormValues } from '../../utils/profileMapper';

export function useEditProfileFormBackup(options: { initialUser?: UserProfile } = {}) {
  const router = useRouter();
  const { data: fetchedUser, isLoading: isQueryLoading } = profileService.useUserProfile({
    enabled: !options.initialUser,
  });
  const user = options.initialUser ?? fetchedUser;
  const isLoading = !options.initialUser && isQueryLoading;

  const isCreateMode = !hasSellerProfile(user);
  const defaultValues = mapUserProfileToFormValues(user);
  const resetKey = [
    user?.userId ?? user?.id ?? 'new',
    user?.sellerProfile?.id ?? '',
    user?.profile?.updatedAt ?? user?.sellerProfile?.updatedAt ?? '',
  ].join(':');
  const lastResetKeyRef = useRef<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onTouched',
  });
  const { reset } = form;

  useEffect(() => {
    if (user && lastResetKeyRef.current !== resetKey) {
      lastResetKeyRef.current = resetKey;
      reset(mapUserProfileToFormValues(user));
    }
  }, [user, reset, resetKey]);

  const navigateToOverview = () => {
    router.replace(PROFILE_ROUTES.overview);
  };

  const updateMutation = profileMutationService.useUpdateProfile(navigateToOverview);
  const createMutation = profileMutationService.useCreateProfile(navigateToOverview);

  const handleAvatarChange = (dataUrl: string) => {
    form.setValue('profilePhotoUrl', dataUrl, { shouldDirty: true });
  };

  const handleCancel = () => {
    if (isCreateMode) {
      router.replace(PROFILE_ROUTES.pendingPosts);
    } else {
      navigateToOverview();
    }
  };

  const { isDirty } = form.formState;

  const onSubmitHandler = async (values: ProfileFormValues) => {
    if (!isCreateMode && !isDirty) {
      toast.info(text.edit.noChanges);
      navigateToOverview();
      return;
    }

    const username = values.username.trim();
    const initialUsername = defaultValues.username.trim();
    const isUsernameChanged = username.toLowerCase() !== initialUsername.toLowerCase();

    if (isUsernameChanged && username.length >= 3) {
      const checkResult = await Result.try(checkUsernameAvailability(username));
      if (!checkResult.ok) {
        toast.error(ERROR_MESSAGES.profile.updateFailed);
        return;
      }

      if (!checkResult.value.available) {
        form.setError('username', {
          type: 'manual',
          message: 'این آیدی قبلا ثبت شده است',
        });
        return;
      }
    }

    const payload = {
      username,
      shopName: values.shopName.trim(),
      bio: values.bio.trim(),
      address: values.address.trim(),
      addressShow: values.showAddress,
      shopPhoneNumber: values.phoneNumber.trim(),
      avatarUrl: values.profilePhotoUrl || null,
    };

    if (isCreateMode) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmitHandler);

  const isSaving = updateMutation.isPending || createMutation.isPending;
  const shopNameForAvatar = defaultValues.shopName || text.overview.fallbackShopName;
  const headerTitle = isCreateMode
    ? 'تکمیل و ایجاد پروفایل'
    : text.edit.headerTitle;
  const submitText = isCreateMode
    ? 'ایجاد پروفایل'
    : text.edit.saveAction;

  return {
    user,
    isLoading,
    form,
    isCreateMode,
    isSaving,
    shopNameForAvatar,
    headerTitle,
    submitText,
    handleAvatarChange,
    handleCancel,
    handleSubmit,
  };
}
*/
