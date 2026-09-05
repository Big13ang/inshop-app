export interface PostMediaItem {
  id: string;
  url: string;
  storageKey: string;
  thumbnailStorageKey: string;
  thumbnailUrl: string;
  mimeType?: string;
  altText?: string | null;
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

