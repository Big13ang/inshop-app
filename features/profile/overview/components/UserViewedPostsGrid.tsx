'use client';

import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { ProfileGridItem } from './ProfileGridItem';
import { useInfiniteViewedPosts } from '@/features/posts/services/viewedPostsService';

function UserViewedPostsEmptyState() {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2 text-secondary" id="user-viewed-empty-state">
      <span className="font-bold text-sm text-primary">هنوز پستی مشاهده نکرده‌اید</span>
      <span className="text-xs">پست‌هایی که در این‌شاپ مشاهده می‌کنید در این بخش قرار می‌گیرند.</span>
      <Link href="/">
        <Button
          id="btn-explore-viewed-posts"
          variant="filled"
          className="mt-3 h-10 px-5 rounded-xl text-xs font-bold"
        >
          مشاهده اکسپلور
        </Button>
      </Link>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="size-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
  );
}

function ViewedGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 w-full">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="aspect-square bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer"
        />
      ))}
    </div>
  );
}

export function UserViewedPostsGrid() {
  const {
    data: infiniteData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteViewedPosts();

  const posts = infiniteData
    ? infiniteData.pages.flatMap((page) => page.data)
    : [];

  const { ref } = useInView({
    threshold: 0.1,
    onChange: (visible) => {
      if (!visible) return;

      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  if (isLoading) {
    return <ViewedGridSkeleton />;
  }

  if (posts.length === 0) {
    return <UserViewedPostsEmptyState />;
  }

  return (
    <div className="w-full border-t border-primary/5">
      <div className="grid grid-cols-3 gap-0.5 w-full">
        {posts.map((post) => (
          <ProfileGridItem
            key={post.id}
            post={post}
          />
        ))}
      </div>

      {hasNextPage && (
        <div
          ref={ref}
          className="h-10 flex items-center justify-center py-4"
        >
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}
    </div>
  );
}
