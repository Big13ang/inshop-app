'use client';

import { useRouter } from 'next/navigation';
import AddPostView from './AddPostView';

export default function AddPostClientWrapper() {
  const router = useRouter();

  return <AddPostView onNavigate={() => router.back()} />;
}
