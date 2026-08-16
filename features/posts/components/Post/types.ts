export interface PostMediaItem {
  url?: string | null;
  storageKey?: string | null;
}

export interface BasePostData {
  id: string;
  description: string;
  media?: PostMediaItem[];
  createdAt: string;
  sellerName: string;
  sellerAvatar: string;
  isVerified: boolean;
}

