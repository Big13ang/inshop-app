'use client';

import { Images, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/utils';
import type { SellerPost } from '@/features/posts/services/postsQueryService';
import { text } from '../../constants';

/** First sentence of the caption — enough to label a thumbnail without dumping the whole post. */
function getCaptionLabel(description: string): string {
  return description.split(/[.،؛\n]/)[0]?.trim() ?? '';
}

interface ProfileGridCellProps {
  post: SellerPost;
}

function ProfileGridCell({ post }: ProfileGridCellProps) {
  const cover = post.media?.[0];
  const hasMultipleMedia = (post.media?.length ?? 0) > 1;
  const captionLabel = getCaptionLabel(post.description);

  return (
    <figure
      id={`profile-grid-item-${post.id}`}
      // content-visibility keeps long grids off the layout/paint path until scrolled to.
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 150px' }}
      className="relative m-0 block aspect-square w-full overflow-hidden bg-surface-l1"
    >
      {cover ? (
        // CDN-hosted post media, dimensions unknown at render time.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getMediaUrl(cover)}
          alt={captionLabel}
          loading="lazy"
          decoding="async"
          className="size-full animate-fade-in object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-secondary/50">
          <ImageOff className="size-5" aria-hidden="true" />
        </span>
      )}

      {hasMultipleMedia ? (
        <span
          className="absolute top-1.5 right-1.5 rounded-chip bg-black/60 p-1.5 text-white"
          title={text.overview.gridMultiMediaLabel}
        >
          <Images className="size-3" aria-hidden="true" />
        </span>
      ) : null}
    </figure>
  );
}

interface ProfilePostGridProps {
  posts: SellerPost[];
  onAddPost: () => void;
}

export default function ProfilePostGrid({ posts, onAddPost }: ProfilePostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" dir="rtl">
        <ImageOff className="size-10 text-secondary/30" aria-hidden="true" />
        <h3 className="text-sm font-bold text-primary">{text.overview.gridEmptyTitle}</h3>
        <p className="text-xs text-secondary">{text.overview.gridEmptyDescription}</p>
        <Button onClick={onAddPost}>{text.overview.gridEmptyAction}</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <ProfileGridCell key={post.id} post={post} />
      ))}
    </div>
  );
}
