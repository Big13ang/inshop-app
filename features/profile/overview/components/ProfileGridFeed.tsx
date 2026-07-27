'use client';

import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/features/posts/utils/media';
import { text } from '../../constants';

export interface GridPostItem {
  id: string;
  images?: string[];
  caption?: string;
  media?: Array<{ url?: string | null; storageKey?: string | null }>;
  [key: string]: unknown;
}

interface ProfileGridItemProps {
  post: GridPostItem;
  onClick: (id: string) => void;
}

function ProfileGridItem({ post, onClick }: ProfileGridItemProps) {
  const images = (post.images && post.images.length > 0)
    ? post.images
    : (post.media ? post.media.map((m) => getMediaUrl(m)).filter(Boolean) : []);
  const hasMultipleImages = images.length > 1;
  const firstImage = images[0] || '';
  const captionText = post.caption || (post.description as string) || '';
  const accessibilityLabel = text.overview.gridItemLabel(captionText.split(/[.،؛]/)[0] || '');
  const imageAlt = `تصویر محصول ${captionText.split(/[.،؛]/)[0] || ''}`;

  return (
    <button
      type="button"
      onClick={() => onClick(post.id)}
      className="w-full aspect-square bg-surface relative overflow-hidden cursor-pointer outline-none focus:ring-1 focus:ring-zinc-800 text-right block"
      id={`profile-grid-item-${post.id}`}
      aria-label={accessibilityLabel}
    >
      {firstImage ? (
        <img
          src={firstImage}
          className="w-full h-full object-cover animate-fade-in"
          alt={imageAlt}
        />
      ) : (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800" />
      )}

      {hasMultipleImages ? (
        <div className="absolute top-1.5 right-1.5 bg-black/60 p-1.5 rounded-md text-white" aria-label={text.overview.gridMultiMediaLabel}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 2H8a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V4a2 2 0 00-2-2zm-1 12H9V5h9v9zM6 6H4v12a2 2 0 002 2h12v-2H6V6z" />
          </svg>
        </div>
      ) : null}
    </button>
  );
}

interface ProfileGridFeedProps {
  posts: GridPostItem[];
  onPostClick: (id: string) => void;
  onAddPost?: () => void;
  limit?: number;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

interface ProfileEmptyStateProps {
  onAddPost?: () => void;
}

function ProfileEmptyState({ onAddPost }: ProfileEmptyStateProps) {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2 text-secondary" id="profile-empty-state">
      <span className="font-bold text-sm text-primary">{text.overview.gridEmptyTitle}</span>
      <span className="text-xs">{text.overview.gridEmptyDescription}</span>
      {onAddPost ? (
        <Button
          id="profile-add-post-btn"
          variant="filled"
          onClick={onAddPost}
          className="mt-3 h-10 px-5 rounded-xl text-xs font-bold"
        >
          {text.overview.gridEmptyAction}
        </Button>
      ) : null}
    </div>
  );
}

export default function ProfileGridFeed({
  posts,
  onPostClick,
  onAddPost,
  limit,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: ProfileGridFeedProps) {
  const displayPosts = limit ? posts.slice(0, limit) : posts;
  const hasPosts = displayPosts && displayPosts.length > 0;

  const { ref: observerRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage && onLoadMore) {
        onLoadMore();
      }
    },
  });

  if (!hasPosts) {
    return <ProfileEmptyState onAddPost={onAddPost} />;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="grid grid-cols-3 gap-0.5">
        {displayPosts.map((post) => (
          <ProfileGridItem
            key={post.id}
            post={post}
            onClick={onPostClick}
          />
        ))}
      </div>
      {/* Sentinel element for infinite scroll loading */}
      {hasNextPage ? (
        <div ref={observerRef} className="h-10 w-full flex items-center justify-center py-4 col-span-3">
          {isFetchingNextPage ? (
            <div className="size-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
