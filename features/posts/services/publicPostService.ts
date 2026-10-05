import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { http, Result, type ApiResponse } from '@/lib/utils';
import { getCachedFeedPosts, type BackendFeedPost } from '@/features/feed/services/feedService';


export interface PublicPostShop {
  shopName: string;
  username: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  shopPhoneNumber: string | null;
  address: string | null;
}

export interface PublicPostMedia {
  id: string;
  uploadSessionId: string;
  sellerId: string;
  postId: string;
  status: string;
  storageKey: string;
  thumbnailStorageKey: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  altText: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl: string;
}

export interface PublicPost {
  id: string;
  description: string;
  publishedAt: string;
  owner?: PublicPostShop;
  shop?: PublicPostShop;
  media: PublicPostMedia[];
}

export function mapFeedPostToPublicPost(feedPost: BackendFeedPost): PublicPost {
  const owner: PublicPostShop | undefined = feedPost.owner
    ? {
        shopName: feedPost.owner.shopName,
        username: feedPost.owner.username,
        bio: null,
        profilePhotoUrl: feedPost.owner.profileUrl,
        shopPhoneNumber: null,
        address: null,
      }
    : undefined;

  return {
    id: feedPost.id,
    description: feedPost.description,
    publishedAt: feedPost.createdAt || feedPost.updatedAt,
    owner,
    shop: owner,
    media: (feedPost.media || []).map((m) => ({
      id: m.id,
      uploadSessionId: m.uploadSessionId,
      sellerId: m.sellerId,
      postId: m.postId,
      status: m.status,
      storageKey: m.storageKey,
      thumbnailStorageKey: m.thumbnailStorageKey,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      order: m.order,
      altText: m.altText,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
    })),
  };
}

export function findPostInQueryCache(queryClient: QueryClient, id: string): PublicPost | undefined {
  if (!id) return undefined;

  const direct = queryClient.getQueryData<PublicPost>(['posts', 'public-detail', id]);
  if (direct) return direct;

  const match = getCachedFeedPosts(queryClient).find((post) => post.id === id);
  return match ? mapFeedPostToPublicPost(match) : undefined;
}


export function usePublicPostById(id: string, initialData?: PublicPost | null) {
  const queryClient = useQueryClient();

  const cachedPost = findPostInQueryCache(queryClient, id);
  const resolvedInitialData = initialData ?? cachedPost ?? undefined;

  return useQuery<PublicPost | null>({
    queryKey: ['posts', 'public-detail', id],
    queryFn: async () => {
      const resResult = await Result.try(() =>
        http.get<ApiResponse<PublicPost>>(`/posts/${id}`)
      );
      if (!resResult.ok || !resResult.value?.data) {
        return null;
      }

      return resResult.value.data;
    },
    enabled: !!id,
    initialData: resolvedInitialData,
    initialDataUpdatedAt: initialData ? Date.now() : 0,
    staleTime: 1000 * 60 * 5,
  });
}

