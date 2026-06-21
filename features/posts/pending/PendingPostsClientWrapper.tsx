'use client';

import { useRouter } from 'next/navigation';
import PendingPostsView from './PendingPostsView';

export default function PendingPostsClientWrapper() {
  const router = useRouter();

  return <PendingPostsView onBack={() => router.back()} onAddPost={() => router.push('/app/posts/new')} />;
}
