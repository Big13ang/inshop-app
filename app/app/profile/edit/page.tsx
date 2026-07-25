import { Suspense } from 'react';
import type { Metadata } from 'next';
import EditProfileClientWrapper from '@/features/profile/edit/EditProfileClientWrapper';
import { ProfileEditSkeleton } from '@/features/profile/components/ProfileSkeleton';

export const metadata: Metadata = {
  title: 'ویرایش پروفایل | اینشاپ',
};

/**
 * Cache Components: static form shell first, seller values streamed in behind
 * the Suspense boundary once the session-scoped profile resolves.
 */
export default function EditProfilePage() {
  return (
    <Suspense fallback={<ProfileEditSkeleton />}>
      <EditProfileClientWrapper />
    </Suspense>
  );
}
