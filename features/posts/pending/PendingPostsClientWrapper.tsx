'use client';

import { useRouter } from 'next/navigation';
import { PendingPostsView } from './PendingPostsView';

export function PendingPostsClientWrapper() {
  const router = useRouter();

  function handleAddPost() {
    router.push('/app/posts/new');
  }

  return <PendingPostsView onAddPost={handleAddPost} />;
}

