'use client';

import { LoaderCircle } from 'lucide-react';
import type { BackendFeedPost } from '../services/feedService';
import { GridTile } from './GridTile';
import { FeedSkeleton } from './FeedSkeleton';
import { FeedEmptyState } from './FeedEmptyState';
import { Button } from '@/components/ui/button';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';

export interface FeedContentProps {
  posts: BackendFeedPost[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  onRetry?: () => void;
}

export function FeedContent({
  posts,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onRetry,
}: FeedContentProps) {
  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (posts.length === 0) {
    if (isError) {
      return (
        <div className="pt-16 px-4 text-center space-y-4">
          <p className="text-sm text-zinc-600 font-medium">
            خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.
          </p>
          {onRetry ? (
            <Button type="button" size="sm" onClick={onRetry} variant="outline">
              تلاش مجدد
            </Button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="pt-12 px-4">
        <FeedEmptyState
          title="موردی یافت نشد"
          description="هیچ ویدیویی یا محصولی وجود ندارد."
          id="feed-empty-state"
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 w-full bg-white" id="home-3x5-grid">
        {posts.map((post) => (
          <GridTile key={post.id} post={post} />
        ))}
      </div>

      {/* Bottom infinite scroll loader & sentinel target */}
      <div ref={sentinelRef} className="w-full py-4 flex flex-col justify-center items-center gap-2">
        {isFetchingNextPage ? (
          <LoaderCircle className="w-5 h-5 animate-spin text-zinc-500" />
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs text-zinc-500 font-medium">خطا در دریافت ادامه مطالب</p>
            {onRetry ? (
              <Button type="button" size="sm" onClick={onRetry} variant="outline" className="text-xs h-8">
                تلاش مجدد
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
