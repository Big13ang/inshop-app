'use client';

import { useInView } from 'react-intersection-observer';
import { postsQueryService } from '@/features/posts/services/postsQueryService';
import { ProfileEmptyState } from './ProfileGridEmptyState';
import ProfileGridItem from './ProfileGridItem';

interface ProfileGridFeedProps {
  username?: string;
  onPostClick?: (id: string) => void;
}

export default function ProfileGridFeed({
  username,
  onPostClick,
}: ProfileGridFeedProps) {
  const {
    data: infiniteData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = postsQueryService.useInfinitePostsByUsername(username);

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