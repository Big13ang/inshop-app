'use client';

import { useUser } from '../context/UserContext';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import EditProfileView from './EditProfileView';

export default function EditProfileClientWrapper() {
  const { user, isLoading } = useUser();

  // The form seeds react-hook-form from `user` once, so it must not mount
  // before the profile is available.
  if (isLoading || !user) {
    return <ProfileEditSkeleton />;
  }

  return <EditProfileView key={user.id} user={user} />;
}
