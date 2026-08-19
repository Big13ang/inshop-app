export interface FeedMediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface FeedPost {
  id: string;
  sellerName: string;
  sellerAvatar: string;
  isVerified?: boolean;
  images: string[];
  media?: FeedMediaItem[];
  isVideo?: boolean;
  videoUrl?: string;
  likes: number;
  commentsCount: number;
  caption: string;
  shopName: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface FeedViewProps {
  initialPosts?: FeedPost[];
  className?: string;
}
