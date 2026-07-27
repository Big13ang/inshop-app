'use client';

import { hasSellerProfile, profileService } from '../services/profileService';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import EditProfileView from './EditProfileView';

export default function EditProfileClientWrapper() {
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
