'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedIconButton from '@/components/ui/AnimatedIconButton';
import { usePostContext } from './PostContext';

export function PostActions() {
  const router = useRouter();
  const { state, actions } = usePostContext();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleChatClick = () => {
    router.push(`/chat?seller=${encodeURIComponent(state.post.sellerName)}`);
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 mt-1 bg-white" dir="rtl">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleChatClick}
          className="bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-full px-6 py-2"
        >
          خریدارم
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <AnimatedIconButton
          id={`btn-share-${state.post.id}`}
          aria-label="اشتراک‌گذاری پست"
          onClick={actions.openMenu}
        >
          <Share2 className="w-6 h-6 text-zinc-700" strokeWidth={2} />
        </AnimatedIconButton>

        <AnimatedIconButton
          onClick={handleBookmarkToggle}
          id={`btn-bookmark-${state.post.id}`}
          isActive={isBookmarked}
          aria-label="نشان کردن پست"
        >
          <Bookmark
            className="w-6 h-6 text-zinc-700 transition-colors duration-200"
            strokeWidth={2}
            fill={isBookmarked ? 'currentColor' : 'none'}
          />
        </AnimatedIconButton>
      </div>
    </div>
  );
}

export default PostActions;
