'use client';

import { MoreHorizontal, Share2, Bookmark, Store } from 'lucide-react';
import AnimatedIconButton from '@/components/ui/AnimatedIconButton';
import { Button } from '@/components/ui/button';
import PostSlider from './PostSlider';

export interface DetailCardPost {
  id: string;
  shopName?: string;
  sellerName?: string;
  sellerAvatar?: string;
  caption?: string;
  description?: string;
  images?: string[];
  media?: { url: string; type?: 'image' | 'video' }[];
  price?: string;
  isBookmarked?: boolean;
  isVerified?: boolean;
  [key: string]: unknown;
}

interface ProfileDetailCardProps {
  post: DetailCardPost;
  onCall?: () => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onOpenMenu?: (id: string) => void;
  isClickedPost?: boolean;
}

export default function ProfileDetailCard({
  post,
  onCall,
  onShare,
  onBookmark,
  onOpenMenu,
}: ProfileDetailCardProps) {
  if (!post) return null;

  const sellerName = post.sellerName || post.shopName || 'فروشگاه';
  const sellerAvatar = post.sellerAvatar;
  const caption = post.caption || post.description || '';
  const images: string[] = post.images || (post.media ? post.media.map((m: { url?: string } | string) => (typeof m === 'string' ? m : m?.url || '')).filter(Boolean) : []);
  const isBookmarked = !!post.isBookmarked;

  const handleShareClick = () => {
    onShare?.(post.id);
  };

  const handleBookmarkClick = () => {
    onBookmark?.(post.id);
  };

  const handleOpenMenuClick = () => {
    onOpenMenu?.(post.id);
  };

  return (
    <article
      id={`feed-detail-card-${post.id}`}
      className="w-full bg-surface border-b border-primary/5 pb-3 relative"
    >
      {/* Header / Seller Profile */}
      <div className="flex items-center justify-between px-4 py-3" dir="rtl">
        <div className="flex items-center gap-3">
          {sellerAvatar ? (
            <img
              alt={sellerName}
              src={sellerAvatar}
              className="w-10 h-10 rounded-full object-cover border border-primary/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center bg-surface-l1 text-secondary shrink-0">
              <Store className="w-5 h-5" aria-hidden="true" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-sm text-primary">{sellerName}</span>
          </div>
        </div>

        <AnimatedIconButton
          id={`post-actions-${post.id}`}
          onClick={handleOpenMenuClick}
        >
          <MoreHorizontal className="w-6 h-6 text-primary" strokeWidth={2} />
        </AnimatedIconButton>
      </div>

      {/* Swipeable Image Slider */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-surface-container cursor-pointer">
        <PostSlider images={images} />
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-4 py-2 mt-1" dir="rtl">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="filled"
            onClick={onCall}
            className="h-10 px-6 rounded-full text-xs font-bold shadow-xs active:scale-95"
          >
            خریدارم
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <AnimatedIconButton
            id={`btn-share-${post.id}`}
            aria-label="Share post"
            onClick={handleShareClick}
          >
            <Share2 className="w-7 h-7 text-primary" strokeWidth={2} />
          </AnimatedIconButton>

          <AnimatedIconButton
            id={`btn-bookmark-${post.id}`}
            aria-label="Bookmark post"
            onClick={handleBookmarkClick}
            isActive={isBookmarked}
          >
            <Bookmark
              className="w-7 h-7 text-primary transition-colors duration-200"
              strokeWidth={2}
              fill={isBookmarked ? 'currentColor' : 'none'}
            />
          </AnimatedIconButton>
        </div>
      </div>

      {/* Caption & Description */}
      <div className="px-4 pb-1 text-right" dir="rtl">
        <span className="font-bold text-sm text-primary mb-1 block">
          {sellerName}
        </span>
        <p className="text-[13px] text-secondary leading-6 text-justify">
          {caption}
        </p>
      </div>
    </article>
  );
}
