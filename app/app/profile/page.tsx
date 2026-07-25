import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProfileView from '@/features/profile/overview/ProfileView';
import { ProfileOverviewSkeleton } from '@/features/profile/components/ProfileSkeleton';

export const metadata: Metadata = {
  title: 'پروفایل فروشگاه | اینشاپ',
};

/**
 * Cache Components: the skeleton shell prerenders as static output, while the
 * seller-specific content — which depends on the session cookie — streams in
 * behind the Suspense boundary.
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileOverviewSkeleton />}>
      <ProfileView />
    </Suspense>
  );
}
