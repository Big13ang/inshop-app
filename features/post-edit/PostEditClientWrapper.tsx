'use client';

import { PostDetailsPhaseView } from '@/features/posts/new/components/PostDetailsPhaseView';
import AddPostLoadingSkeleton from '@/features/posts/new/components/AddPostLoadingSkeleton';
import { PostEditFooter } from '@/features/post-edit/components/PostEditFooter';
import { PostEditHeader } from '@/features/post-edit/components/PostEditHeader';
import { PostEditNotFound } from '@/features/post-edit/components/PostEditNotFound';
import { PostEditOffline } from '@/features/post-edit/components/PostEditOffline';
import { PostEditStoreSync } from '@/features/post-edit/components/PostEditStoreSync';
import { usePostForEdit } from '@/features/post-edit/services/postEditService';

// A failed request with no server answer (offline, or the connection dropped) throws a
// TypeError from fetch. Anything the server answered is a real "not found" or access error.
function isNetworkError(error: unknown): boolean {
  return !navigator.onLine || error instanceof TypeError;
}

export function PostEditClientWrapper({ postId }: { postId: string }) {
  const { data, error, isPending, isError, refetch } = usePostForEdit(postId);

  function handleRetry() {
    void refetch();
  }

  if (isPending) return <AddPostLoadingSkeleton />;
  if (isError && isNetworkError(error)) return <PostEditOffline onRetry={handleRetry} />;
  if (isError) return <PostEditNotFound />;

  return (
    <>
      <PostEditStoreSync post={data} />
      <div className="flex-1 flex flex-col min-h-0 w-full bg-surface-l3 relative overflow-hidden select-none">
        <PostEditHeader />
        <PostDetailsPhaseView />
        <PostEditFooter postId={data.id} />
      </div>
    </>
  );
}
