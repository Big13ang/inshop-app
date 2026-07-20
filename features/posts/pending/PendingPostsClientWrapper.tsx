'use client';

import { useRouter } from 'next/navigation';
import PendingPostsView from './PendingPostsView';

export default function PendingPostsClientWrapper() {
  const router = useRouter();

  const handleBack = () => {
    router.replace('/');
  };

  const handleAddPost = () => {
    router.push('/app/posts/new');
  };

  return <PendingPostsView onBack={handleBack} onAddPost={handleAddPost} />;
}
