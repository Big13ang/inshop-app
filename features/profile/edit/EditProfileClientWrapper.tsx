'use client';

import { profileService } from '../services/profileService';
import EditProfileView from './EditProfileView';

export default function EditProfileClientWrapper() {
  const { data: me } = profileService.useMe();
  const hasSellerProfile = me?.sellerProfile !== null;
  const { data: userProfile } = profileService.useUserProfile({
    enabled: hasSellerProfile,
  });

  const user = hasSellerProfile ? userProfile : me;

  return <EditProfileView user={user} />;
}
