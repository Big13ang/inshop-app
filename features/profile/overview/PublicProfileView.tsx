'use client';

import { notFound } from 'next/navigation';
import { ProfileView } from './ProfileView';
import { profileService } from '../services/profileService';
import type { SellerPostsByUsernameData } from '@/features/posts/types';
import { useUser } from '../context/UserContext';
import { ProfileOverviewSkeleton } from '../components/ProfileSkeleton';
import { shopAnalytics } from '../analytics/shopAnalytics';
import { TrackOnView } from '@/lib/analytics/TrackOnView';

interface PublicProfileViewProps {
  username: string;
  initialData?: SellerPostsByUsernameData | null;
}

export function PublicProfileView({ username, initialData }: PublicProfileViewProps) {
  const { user: me } = useUser();

  const mySellerProfile = me?.sellerProfile;
  const ownProfile = mySellerProfile?.username.toLowerCase() === username.toLowerCase()
    ? mySellerProfile
    : null;
  const isOwner = ownProfile !== null;

  const { data: profileData, isLoading } = profileService.useUserProfile(username, {
    enabled: Boolean(username) && !isOwner,
    initialData: initialData ?? undefined,
  });

  const activeData = profileData ?? initialData;
  const shop = ownProfile ?? activeData?.shop;

  if (!shop && isLoading) return <ProfileOverviewSkeleton />;
  if (!shop && !isLoading) notFound();
  if (!shop) return <ProfileOverviewSkeleton />;

  const rawShopName = shop.shopName?.trim();
  const pageTitle = rawShopName
    ? `${rawShopName} (@${shop.username}) | اینشاپ`
    : `@${shop.username} | اینشاپ`;

  const handleShopVisible = () => {
    shopAnalytics.viewShop({ username: shop.username, shopName: shop.shopName }, isOwner);
  };

  return (
    <>
      <title>{pageTitle}</title>
      <TrackOnView key={shop.username} onView={handleShopVisible} />
      <ProfileView profile={shop} isOwner={isOwner} />
    </>
  );
}
