export interface PublicSearchDto {
  q: string;
  cursor?: string;
  limit?: number;
}

export interface SearchProfileDto {
  id: string;
  username: string;
  shopName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
}

export interface PostOwnerDto {
  shopName: string;
  username: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  shopPhoneNumber: string | null;
  address: string | null;
}

export interface PostMediaDto {
  id: string;
  storageKey: string | null;
  thumbnailStorageKey: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  order: number;
  altText: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostResponseDto {
  id: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  owner: PostOwnerDto | null;
  media: PostMediaDto[];
}

export interface SearchPaginationDto {
  nextCursor: string | null;
  hasNext: boolean;
}

export interface SearchResponseDto {
  profiles: SearchProfileDto[];
  posts: PostResponseDto[];
  pagination: SearchPaginationDto;
}

export interface SearchApiResponse {
  success?: boolean;
  data?: SearchResponseDto;
  profiles?: SearchProfileDto[];
  posts?: PostResponseDto[];
  pagination?: {
    nextCursor?: string | null;
    hasNext?: boolean;
  };
}

export interface InShopSearchResultProps {
  /** The active search query term entered by user */
  query: string;
  /** Optional custom profiles list; defaults to search API */
  profiles?: SearchProfileDto[];
  /** Optional custom posts list; defaults to search API */
  posts?: PostResponseDto[];
  /** Optional custom empty state message */
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  /** Additional container CSS class name */
  className?: string;
}

