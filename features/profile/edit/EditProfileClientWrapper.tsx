'use client';

import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import { profileService, type UserProfile } from '../services/profileService';
import EditProfileView from './EditProfileView';

function getEditUser(me: UserProfile, userProfile?: UserProfile) {
  if (!userProfile) return me;

  return {
    ...me,
    ...userProfile,
    sellerProfile: {
      id: userProfile.id || me.sellerProfile?.id || '',
      userId: userProfile.userId || me.sellerProfile?.userId || me.id || '',
      username: userProfile.username || me.sellerProfile?.username || '',
      shopName: userProfile.shopName || me.sellerProfile?.shopName || '',
      bio: userProfile.bio ?? me.sellerProfile?.bio,
      profilePhotoUrl: userProfile.profilePhotoUrl ?? me.sellerProfile?.profilePhotoUrl,
      address: userProfile.address ?? me.sellerProfile?.address,
      addressProvince: userProfile.addressProvince ?? me.sellerProfile?.addressProvince,
      addressCity: userProfile.addressCity ?? me.sellerProfile?.addressCity,
      addressShow: userProfile.addressShow ?? me.sellerProfile?.addressShow,
      phones: userProfile.phones || me.sellerProfile?.phones,
      createdAt: me.sellerProfile?.createdAt,
      updatedAt: userProfile.profile?.updatedAt || me.sellerProfile?.updatedAt,
    },
  };
}

export default function EditProfileClientWrapper() {
  const { data: me, isLoading: isMeLoading } = profileService.useMe();
  const hasSellerProfile = Boolean(me?.sellerProfile);
  const {
    data: userProfile,
    isLoading: isProfileLoading,
  } = profileService.useUserProfile({
    enabled: hasSellerProfile,
  });

  if (isMeLoading || !me || (hasSellerProfile && (isProfileLoading || !userProfile))) {
    return <ProfileEditSkeleton />;
  }

  return <EditProfileView user={getEditUser(me, hasSellerProfile ? userProfile : undefined)} />;
}
