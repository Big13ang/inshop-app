import { Suspense } from 'react';
import type { Metadata } from 'next';
import OwnProfileView from '@/features/profile/overview/OwnProfileView';
import { ProfileOverviewSkeleton } from '@/features/profile/components/ProfileSkeleton';

export const metadata: Metadata = {
  title: 'پروفایل فروشگاه | اینشاپ',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileOverviewSkeleton />}>
      <OwnProfileView />
    </Suspense>
  );
}
