import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http, type ApiResponse, type PaginatedApiResponse } from '@/lib/utils';
import { queryCacheFactory, queryKeys } from '@/lib/query-keys';
import { useUser } from '@/features/profile/context/UserContext';
import type { PublicSellerProfile } from '@/features/profile/services/profileService';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

export interface UploadSessionData {
  uploadSessionId: string;
  expiresAt: string;
}

export interface SubmitPostPayload {
  uploadSessionId: string;
  description: string;
  mediaIds: string[];
}

export interface BackendMedia {
  id: string;
  uploadSessionId: string;
  sellerId: string;
  postId: string;
  status: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  url: string | null;
}

export const POST_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELETED: 'DELETED',
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

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

interface CursorPaginatedResult<T> {
  data: T[];
  pagination: { nextCursor: string | null; hasNext: boolean };
}

export interface DeleteUploadSessionPhotoParams {
  uploadSessionId: string;
  mediaId: string;
}

export async function deleteUploadSessionPhoto({
  uploadSessionId,
  mediaId,
}: DeleteUploadSessionPhotoParams): Promise<void> {
  await http.delete(
    `/upload-sessions/${uploadSessionId}/photos/${mediaId}`
  );
}

async function fetchPendingRejectedPosts(): Promise<SellerPost[]> {
  const res = await http.get<ApiResponse<SellerPost[]>>(
    '/seller/posts/pending-rejected'
  );
  return res.data || [];
}

export async function fetchApprovedPostsBySeller(
  sellerId: string,
  cursor?: string | null,
  limit: number = 12
): Promise<CursorPaginatedResult<SellerPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<PaginatedApiResponse<SellerPost>>(
    `/posts/seller/${encodeURIComponent(sellerId)}`,
    { searchParams: params }
  );
  return {
    data: res.data || [],
    pagination: {
      nextCursor: res.pagination?.nextCursor ?? null,
      hasNext: res.pagination?.hasNext ?? false,
    },
  };
}

export async function fetchApprovedPostsByUsername(
  username: string,
  cursor?: string | null,
  limit: number = 12
): Promise<CursorPaginatedResult<SellerPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<ApiResponse<SellerPostsByUsernameData>>(
    `/posts/seller/username/${encodeURIComponent(username)}`,
    { searchParams: params }
  );
  return {
    data: res.data?.products || [],
    pagination: {
      nextCursor: res.data?.pagination?.nextCursor ?? null,
      hasNext: res.data?.pagination?.hasNext ?? false,
    },
  };
}

function removePostFromFeedCache(queryClient: QueryClient, deletedId: string) {
  queryClient.setQueriesData<{ pages: { data: { id: string }[] }[] }>(
    { queryKey: ['posts', 'feed'] },
    (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.filter((post) => post.id !== deletedId),
        })),
      };
    }
  );
}

export const postsQueryService = {

  /**
   * Fetch pending and rejected posts for the authenticated seller using GET /seller/posts/pending-rejected.
   */
  usePendingRejectedPosts(options?: { enabled?: boolean }) {
    const { user } = useUser();
    const isEnabled = (options?.enabled ?? true) && !!user;

    return useQuery<SellerPost[]>({
      queryKey: [...queryKeys.posts.seller(), 'pending-rejected'],
      queryFn: () => fetchPendingRejectedPosts(),
      enabled: isEnabled,
    });
  },

  /**
   * Fetch approved posts for a specific seller by sellerId using GET /posts/seller/:sellerId.
   */
  useApprovedPostsBySeller(sellerId?: string, limit: number = 20) {
    return useQuery<CursorPaginatedResult<SellerPost>>({
      queryKey: [...queryKeys.posts.all, 'seller-approved', sellerId, limit],
      queryFn: () => fetchApprovedPostsBySeller(sellerId!, null, limit),
      enabled: !!sellerId,
    });
  },

  /**
   * Infinite cursor query for approved seller posts by username (/posts/seller/username/:username).
   */
  useInfinitePostsByUsername(username?: string, limit: number = 6) {
    const trimmed = (username || '').trim();

    return useInfiniteQuery({
      queryKey: [...queryKeys.posts.all, 'seller-username-infinite', trimmed, limit],
      queryFn: ({ pageParam }) =>
        fetchApprovedPostsByUsername(trimmed, pageParam as string | null, limit),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) =>
        lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
      enabled: Boolean(trimmed),
    });
  },

  useSubmitPost(onSuccess: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (payload: SubmitPostPayload) => {
        await http.post(
          '/upload-sessions/publish',
          payload
        );
      },
      onSuccess: () => {
        queryCacheFactory.posts.invalidateSeller(queryClient);

        onSuccess?.();
      },
      onError: () => {
        toast.error(ERROR_MESSAGES.posts.submitFailed);
      },
    });
  },

  useDeletePendingPost() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        await http.delete(`/seller/posts/${id}`);
      },
      onSuccess: (_data, deletedId) => {
        removePostFromFeedCache(queryClient, deletedId);

        // Invalidate pending posts page query
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.posts.seller(), 'pending-rejected'],
        });

        toast.success('پست با موفقیت حذف شد');
      },
      onError: () => toast.error(ERROR_MESSAGES.posts.deleteFailed),
    });
  },

  useDeleteUploadSessionPhoto() {
    return useMutation({
      mutationFn: deleteUploadSessionPhoto,
      onSuccess: () => {
        toast.success(ERROR_MESSAGES.posts.imageDeleteSuccess);
      },
      onError: () => {
        toast.error(ERROR_MESSAGES.posts.deleteFailed);
      },
    });
  },
};
