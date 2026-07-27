'use client';

import { useEffect } from 'react';
import ProfileDetailCard, { DetailCardPost } from './ProfileDetailCard';

interface ProfileDetailFeedProps {
  posts: DetailCardPost[];
  clickedPostId: string | null;
  onClose: () => void;
  onCall: () => void;
  onShare: (id: string) => void;
  onBookmark: (id: string) => void;
  onOpenMenu: (id: string) => void;
}

export default function ProfileDetailFeed({
  posts,
  clickedPostId,
  onClose: _onClose,
  onCall,
  onShare,
  onBookmark,
  onOpenMenu,
}: ProfileDetailFeedProps) {
  const hasPosts = posts && posts.length > 0;

  useEffect(() => {
    if (clickedPostId) {
      const el = document.getElementById(`feed-detail-card-${clickedPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [clickedPostId]);

  if (!hasPosts) {
    return (
      <div className="py-20 text-center text-secondary text-sm flex flex-col items-center justify-center gap-2">
        <span>هیچ جزئیاتی برای نمایش وجود ندارد.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-4 pt-1 px-0">

      {posts.map((post) => (
        <ProfileDetailCard
          key={post.id}
          post={post}
          onCall={onCall}
          onShare={onShare}
          onBookmark={onBookmark}
          onOpenMenu={onOpenMenu}
          isClickedPost={post.id === clickedPostId}
        />
      ))}
    </div>
  );
}
