'use client';

import { useRouter } from 'next/navigation';
import AddPostView from './AddPostView';

export default function AddPostClientWrapper() {
  const router = useRouter();

  return (
    <AddPostView
      onNavigate={(intent) => (intent === 'pending-posts' ? router.push('/app/posts/pending') : router.back())}
    />
  );
}
