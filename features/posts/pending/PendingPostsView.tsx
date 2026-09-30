'use client';

import { useState } from 'react';
import { Hourglass } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import Header from '@/components/layout/Header';
import MainFooter from '@/components/layout/MainFooter';
import { Button } from '@/components/ui/button';
import { PostMenu } from '../components/PostMenu';
import { useInfinitePendingRejectedPosts } from './services/pendingPostsService';
import { useDeletePendingPost } from '../services/deletePostService';
import DeletePostConfirmationBottomSheet from '../components/DeletePostConfirmationBottomSheet';
import { PendingPostCard } from './components/PendingPostCard';
import { text } from './constants';

interface PendingPostsViewProps {
  onAddPost: () => void;
}

export function PendingPostsView({ onAddPost }: PendingPostsViewProps) {
  const {
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfinitePendingRejectedPosts();
  const deletePost = useDeletePendingPost();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  function handleCloseMenu() {
    setActiveMenuId(null);
  }

  function handleOpenConfirm(id: string) {
    setActiveMenuId(null);
    setDeletingPostId(id);
  }

  function handleConfirmDelete() {
    if (!deletingPostId) return;
    deletePost.mutate(deletingPostId, {
      onSuccess: () => {
        setDeletingPostId(null);
      },
    });
  }

  function handleObserverChange(inView: boolean) {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }

  const { ref: sentinelRef } = useInView({
    rootMargin: '250px',
    onChange: handleObserverChange,
  });

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="pending-back-btn" />
        <Header.Title>{`${text.headerTitle} (${posts.length})`}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="border-b border-primary/5 bg-surface-container-low px-4 py-3 text-right">
          <p className="text-[11px] leading-5 text-zinc-500">{text.noticeText}</p>
        </div>

        {posts.length === 0 ? (
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" dir="rtl">
              <Hourglass className="h-10 w-10 text-zinc-300" />
              <h3 className="text-sm font-bold text-primary">{text.emptyTitle}</h3>
              <p className="text-xs text-zinc-500">{text.emptyDescription}</p>
              <Button onClick={onAddPost}>{text.emptyActionLabel}</Button>
            </div>
          )
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => (
              <PendingPostCard key={post.id} post={post} onOpenMenu={setActiveMenuId} />
            ))}

            {hasNextPage && (
              <div
                ref={sentinelRef}
                className="flex h-16 w-full items-center justify-center py-4"
                id="pending-infinite-scroll-sentinel"
              >
                {isFetchingNextPage && (
                  <div className="size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <MainFooter />

      <PostMenu.Root isOpen={activeMenuId !== null} onClose={handleCloseMenu}>
        <PostMenu.Title>
          {text.menuTitle}
        </PostMenu.Title>
        {activeMenuId ? (
          <PostMenu.DeleteItem
            postId={activeMenuId}
            label={text.deleteLabel}
            hint={text.deleteHint}
            onClick={() => handleOpenConfirm(activeMenuId)}
          />
        ) : null}
      </PostMenu.Root>

      <DeletePostConfirmationBottomSheet
        isOpen={deletingPostId !== null}
        onClose={() => setDeletingPostId(null)}
        onConfirm={handleConfirmDelete}
        isPending={deletePost.isPending}
        title={text.deleteLabel}
      />
    </div>
  );
}


