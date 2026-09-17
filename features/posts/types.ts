import type { PublicSellerProfile } from '@/features/profile/services/profileService';

export const POST_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELETED: 'DELETED',
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

export interface BackendMedia {
  id: string;
  uploadSessionId: string;
  sellerId: string;
  postId: string;
  status: string;
  storageKey: string;
  thumbnailStorageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  altText?: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl: string;
}

export interface SellerPost {
  id: string;
  sellerId: string;
  description: string;
  status: PostStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  media?: BackendMedia[];
  sellerName?: string;
  shopName?: string;
  sellerAvatar?: string;
  username?: string;
  isVerified?: boolean;
}

export interface SellerPostsByUsernameData {
  shop: PublicSellerProfile;
  products: SellerPost[];
  pagination?: {
    total?: number;
    nextCursor?: string | null;
    hasNext?: boolean;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
  };
}
