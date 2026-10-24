import type { PostStatus } from '@/features/posts/types';

// Mirrors formatSellerPost (inshop-back-end/src/post/seller-post.controller.ts) for
// GET /seller/posts/:id. Dates arrive as ISO strings over JSON.

export interface PostEditOwner {
  shopName: string | null;
  username: string | null;
  profileUrl: string | null;
  profilePhotoUrl: string | null;
  bio: string | null;
  shopPhoneNumber: string | null;
  address: string | null;
}

// Mirrors the Media entity (inshop-back-end/src/upload-session/media.entity.ts)
// plus the url and thumbnailUrl added by enrichMediaWithUrls.
export interface PostEditMedia {
  id: string;
  uploadSessionId: string;
  sellerId: string;
  postId: string | null;
  status: 'PENDING' | 'READY' | 'FAILED' | 'DELETED';
  storageKey: string | null;
  thumbnailStorageKey: string | null;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  altText: string | null;
  createdAt: string;
  updatedAt: string;
  url: string | null;
  thumbnailUrl: string | null;
}

export interface PostEdit {
  id: string;
  sellerId: string;
  description: string;
  productName: string | null;
  productImageUrl: string | null;
  productLink: string | null;
  status: PostStatus;
  isFeedEnabled: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  owner: PostEditOwner | null;
  media: PostEditMedia[];
}

// Mirrors the Post entity returned by PATCH /seller/posts/:id.
export interface PostEditUpdateResult {
  id: string;
  sellerId: string;
  description: string;
  productName: string | null;
  productImageUrl: string | null;
  productLink: string | null;
  status: PostStatus;
  isFeedEnabled: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}
