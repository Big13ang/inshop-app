import { Suspense } from 'react';
import type { Metadata } from 'next';
import EditProfileClientWrapper from '@/features/profile/edit/EditProfileClientWrapper';
import { ProfileEditSkeleton } from '@/features/profile/components/ProfileSkeleton';

export const metadata: Metadata = {
  title: 'ویرایش پروفایل',
};

export default function EditProfilePage() {
  return (
    <Suspense fallback={<ProfileEditSkeleton />}>
      <EditProfileClientWrapper />
    </Suspense>
  );
}
