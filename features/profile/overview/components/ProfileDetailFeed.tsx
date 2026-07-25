'use client';

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
  onClose,
  onCall,
  onShare,
  onBookmark,
  onOpenMenu,
}: ProfileDetailFeedProps) {
  const hasPosts = posts && posts.length > 0;
  const totalPostsCount = hasPosts ? posts.length : 0;

  if (!hasPosts) {
    return (
      <div className="py-20 text-center text-secondary text-sm flex flex-col items-center justify-center gap-2">
        <span>هیچ جزئیاتی برای نمایش وجود ندارد.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-4 pt-1 px-0">
      <div className="px-4 py-1.5 bg-surface-container-low text-xs text-secondary text-right flex items-center justify-between" dir="rtl">
        <span className="font-semibold">
          ({totalPostsCount} پست) برای بازگشت به گالری، دکمه بازگشت بالا را بزنید.
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-primary font-bold hover:underline cursor-pointer"
        >
          بستن فید
        </button>
      </div>

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
