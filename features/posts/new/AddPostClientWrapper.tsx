'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddPostView from './AddPostView';
import { useMediaStore } from './services/mediaStore';

export default function AddPostClientWrapper() {
  const router = useRouter();

  useEffect(() => {
    return () => useMediaStore.getState().reset();
  }, []);

  const handleNavigate = (intent: 'back' | 'pending-posts') => {
    if (intent === 'pending-posts') {
      router.push('/app/posts/pending');
    }
  };

  return <AddPostView onNavigate={handleNavigate} />;
}
