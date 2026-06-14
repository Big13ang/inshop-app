'use client';

import { useRouter } from 'next/navigation';
import AddPostView from './AddPostView';

export default function AddPostClientWrapper() {
  const router = useRouter();

  const handleNavigate = (view: string) => {
    if (view === 'pending-posts') {
      router.back();
    }
  };

  return <AddPostView onNavigate={handleNavigate} />;
}
