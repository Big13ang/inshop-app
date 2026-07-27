'use client';

import { profileService } from '../services/profileService';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import EditProfileView from './EditProfileView';

export default function EditProfileClientWrapper() {
  const { data: user, isLoading } = profileService.useUserProfile();

  if (isLoading || !user) {
    return <ProfileEditSkeleton />;
  }

  return <EditProfileView key={user.id} user={user} />;
}
