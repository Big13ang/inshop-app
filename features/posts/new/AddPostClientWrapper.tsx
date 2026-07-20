'use client';

import { useRouter } from 'next/navigation';
import AddPostView from './AddPostView';

export default function AddPostClientWrapper() {
  const router = useRouter();

  const handleNavigate = (intent: 'back' | 'pending-posts') => {
    if (intent === 'pending-posts') {
      router.push('/app/posts/pending');
    }
  };

  return <AddPostView onNavigate={handleNavigate} />;
}
