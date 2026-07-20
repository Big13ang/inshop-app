'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import AddPostView from './AddPostView';
import { queryKeys } from '@/lib/query-keys';
import { useMediaStore } from './services/mediaStore';
import { PostFlowNavigationIntent } from './hooks/usePostFlow';

function resetDraftSession(queryClient: QueryClient) {
  return () => {
    useMediaStore.getState().reset();
    queryClient.removeQueries({ queryKey: queryKeys.posts.uploadSession() });
  }
}

export default function AddPostClientWrapper() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNavigation = (intent: PostFlowNavigationIntent) => {
    if (intent === 'pending-posts') {
      router.push('/app/posts/pending');
    } else {
      router.back()
    }
  }

  useEffect(() => resetDraftSession(queryClient), [queryClient]);

  return (
    <AddPostView
      onNavigate={handleNavigation}
    />
  );
}
