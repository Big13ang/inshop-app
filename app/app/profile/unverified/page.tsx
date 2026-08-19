import { Suspense } from 'react';
import type { Metadata } from 'next';
import UnverifiedSellerView from '@/features/profile/unverified/UnverifiedSellerView';

export const metadata: Metadata = {
  title: 'فروشنده تأیید نشده | اینشاپ',
};

export default function UnverifiedProfilePage() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-background" />}>
      <UnverifiedSellerView />
    </Suspense>
  );
}
