'use client';

import { useInView } from 'react-intersection-observer';
import type { SellerPost } from '@/features/posts/services/postsQueryService';
import { ProfileEmptyState } from './ProfileGridEmptyState';
import ProfileGridItem from './ProfileGridItem';

interface ProfileGridFeedProps {
  posts?: SellerPost[];
  onPostClick?: (id: string) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export default function ProfileGridFeed({
  posts = [],
  onPostClick,
  onLoadMore,
  hasNextPage = false,
  isFetchingNextPage = false,
}: ProfileGridFeedProps) {
  const { ref } = useInView({
    threshold: 0.1,
    onChange: (visible) => {
      if (!visible) return;

      if (hasNextPage && !isFetchingNextPage) {
        onLoadMore?.();
      }
    },
  });

  if (posts.length === 0) {
    return <ProfileEmptyState />;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <ProfileGridItem
            key={post.id}
            post={post}
            onClick={onPostClick}
          />
        ))}
      </div>

      {hasNextPage && (
        <div
          ref={ref}
          className="h-10 flex items-center justify-center py-4"
        >
          {isFetchingNextPage && (
            <LoadingSpinner />
          )}
        </div>
      )}
    </div>
  );
}


function LoadingSpinner() {
  return (
    <div className="size-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
  );
}