'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';
import type { SellerPost } from '@/features/posts/types';
import type { BackendFeedPost } from '@/features/feed/services/feedService';
import type { PostResponseDto } from '@/features/search/types';
import { getThumbnailUrl } from '@/lib/utils/media';
import { cn } from '@/lib/utils';
import { postAnalytics, type AnalyticsPostItem, type PostListName } from '@/features/posts/analytics/postAnalytics';
import { useTrackOnView } from '@/lib/analytics/TrackOnView';

interface Props {
  post: SellerPost | BackendFeedPost | PostResponseDto;
  listName: PostListName;
  index: number;
}

export function ProfileGridItem({ post, listName, index }: Props) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const images = getImages(post);
  const image = images[0];
  const analyticsItem = toAnalyticsItem(post);

  const handleCardVisible = () => {
    postAnalytics.itemImpression(listName, analyticsItem, index);
  };

  const handleCardClick = () => {
    postAnalytics.selectItem(listName, analyticsItem, index);
  };

  const cardRef = useTrackOnView<HTMLAnchorElement>(handleCardVisible);

  const handleImageLoad = () => {
    setImageStatus('loaded');
  };

  const handleImageError = () => {
    setImageStatus('error');
  };

  const isLoaded = imageStatus === 'loaded';
  const hasError = imageStatus === 'error';

  const content = (
    <div className="w-full h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
      {/* Shimmer Placeholder while image is loading */}
      {!isLoaded && !hasError && image && (
        <div
          className="absolute inset-0 bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer z-10"
          aria-hidden="true"
        />
      )}

      {image && !hasError ? (
        /* biome-ignore lint/performance/noImgElement: dynamic user post media */
        <img
          src={image}
          alt={post.description || 'تصویر محصول'}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800" />
      )}
    </div>
  );

  const className =
    'aspect-square overflow-hidden bg-surface relative block cursor-pointer outline-none focus:ring-1 focus:ring-zinc-800';

  return (
    <Link
      ref={cardRef}
      href={`/p/${post.id}`}
      className={className}
      prefetch={false}
      onClick={handleCardClick}
    >
      {content}
    </Link>
  );
}

function toAnalyticsItem(post: SellerPost | BackendFeedPost | PostResponseDto): AnalyticsPostItem {
  if ('owner' in post && post.owner) {
    return { postId: post.id, shopUsername: post.owner.username, shopName: post.owner.shopName };
  }
  if ('username' in post) {
    return { postId: post.id, shopUsername: post.username, shopName: post.shopName };
  }
  return { postId: post.id };
}

function getImages(post: SellerPost | BackendFeedPost | PostResponseDto) {
  return (
    post.media
      ?.map((media) => getThumbnailUrl(media))
      .filter(Boolean) ?? []
  );
}