'use client';

import { notFound } from 'next/navigation';
import { ProfileView } from './ProfileView';
import { profileService } from '../services/profileService';
import type { SellerPostsByUsernameData } from '@/features/posts/types';
import { useUser } from '../context/UserContext';
import { ProfileOverviewSkeleton } from '../components/ProfileSkeleton';

interface PublicProfileViewProps {
  username: string;
  initialData?: SellerPostsByUsernameData | null;
}

export function PublicProfileView({ username, initialData }: PublicProfileViewProps) {
  const { data: profileData, isLoading } = profileService.useUserProfile(username, {
    enabled: Boolean(username),
    initialData: initialData ?? undefined,
  });

  const { user: me } = useUser();

  const isOwner = Boolean(
    me?.sellerProfile?.username &&
    me.sellerProfile.username.toLowerCase() === username.toLowerCase()
  );

  const activeData = profileData ?? initialData;

  if (isLoading && !activeData) return <ProfileOverviewSkeleton />;
  if (!isLoading && !activeData?.shop) notFound();
  if (!activeData?.shop) return <ProfileOverviewSkeleton />;

  const shop = activeData.shop;
  const rawShopName = shop.shopName?.trim();
  const pageTitle = rawShopName
    ? `${rawShopName} (@${shop.username}) | اینشاپ`
    : `@${shop.username} | اینشاپ`;

  return (
    <>
      <title>{pageTitle}</title>
      <ProfileView profile={shop} isOwner={isOwner} />
    </>
  );
}
