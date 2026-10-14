import type { Metadata } from 'next';
import { PendingPostsClientWrapper } from '@/features/posts/pending/PendingPostsClientWrapper';

export const metadata: Metadata = {
  title: 'پست‌های در انتظار بررسی',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PendingPostsPage() {
  return <PendingPostsClientWrapper />;
}


