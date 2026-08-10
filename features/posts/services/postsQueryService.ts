import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http, type ApiResponse, type PaginatedApiResponse } from '@/lib/utils';
import { queryCacheFactory, queryKeys } from '@/lib/query-keys';
import { optimistic } from '@/lib/optimistic';
import { useUser } from '@/features/profile/context/UserContext';
import type { UserProfile } from '@/features/profile/services/profileService';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { useMediaStore } from '../new/services/mediaStore';

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

export interface BackendPost {
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
  isVerified?: boolean;
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

function toCursorPaginatedResult(res: PaginatedApiResponse<BackendPost>): CursorPaginatedResult<BackendPost> {
  return {
    data: res.data,
    pagination: {
      nextCursor: res.pagination?.nextCursor ?? null,
      hasNext: res.pagination?.hasNext ?? false,
    },
  };
}

async function fetchSellerPosts(user: UserProfile | null): Promise<BackendPost[]> {
  if (!user) return [];
  const res = await http.get<PaginatedApiResponse<BackendPost>>('/seller/posts');
  return res.data;
}

async function fetchSellerPostsPaginated(
  user: UserProfile | null,
  cursor?: string | null,
  limit: number = 6
): Promise<CursorPaginatedResult<BackendPost>> {
  if (!user) {
    return { data: [], pagination: { nextCursor: null, hasNext: false } };
  }
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<PaginatedApiResponse<BackendPost>>('/seller/posts', {
    searchParams: params,
  });
  return toCursorPaginatedResult(res);
}

export async function fetchApprovedPostsBySeller(
  sellerId: string,
  cursor?: string | null,
  limit: number = 12
): Promise<CursorPaginatedResult<BackendPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<PaginatedApiResponse<BackendPost>>(
    `/posts/seller/${encodeURIComponent(sellerId)}`,
    { searchParams: params }
  );
  return toCursorPaginatedResult(res);
}

export const postsQueryService = {
  usePublicPostById(id: string, initialData?: BackendPost | null) {
    return useQuery<BackendPost>({
      queryKey: ['posts', 'public-detail', id],
      queryFn: async () => {
        const res = await http.get<ApiResponse<BackendPost>>(`/seller/posts/${id}`);
        return res.data ?? (res as unknown as BackendPost);
      },
      enabled: !!id,
      initialData: initialData ?? undefined,
    });
  },

  usePendingPosts() {
    const { user } = useUser();

    return useQuery<BackendPost[]>({
      queryKey: queryKeys.posts.seller(),
      queryFn: () => fetchSellerPosts(user),
      enabled: !!user,
    });
  },

  /**
   * Fetch approved posts for a specific seller by sellerId using GET /posts/seller/:sellerId.
   */
  useApprovedPostsBySeller(sellerId?: string, limit: number = 20) {
    return useQuery<CursorPaginatedResult<BackendPost>>({
      queryKey: [...queryKeys.posts.all, 'seller-approved', sellerId, limit],
      queryFn: () => fetchApprovedPostsBySeller(sellerId!, null, limit),
      enabled: !!sellerId,
    });
  },

  /**
   * Reads the same `/seller/posts` cache entry as `usePendingPosts` and narrows
   * it by status, so the profile page adds no extra request.
   */
  useSellerPostsByStatus(status: PostStatus) {
    const { user } = useUser();

    return useQuery<BackendPost[], Error, BackendPost[]>({
      queryKey: queryKeys.posts.seller(),
      queryFn: () => fetchSellerPosts(user),
      enabled: !!user,
      select: (posts) => posts.filter((post) => post.status === status),
    });
  },

  /**
   * Infinite cursor query for seller posts filtered by status.
   * For APPROVED status, fetches directly from /posts/seller/:sellerId.
   * Enables infinite scrolling on profile grids (default page size limit = 6).
   */
  useInfiniteSellerPostsByStatus(status: PostStatus, limit: number = 6) {
    const { user } = useUser();

    return useInfiniteQuery({
      queryKey: [...queryKeys.posts.seller(), 'infinite', status, limit, user?.id],
      queryFn: ({ pageParam }) => {
        if (status === POST_STATUS.APPROVED && user?.id) {
          return fetchApprovedPostsBySeller(user.id, pageParam as string | null, limit);
        }
        return fetchSellerPostsPaginated(user, pageParam as string | null, limit);
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) =>
        lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
      enabled: !!user,
      select: (data) => ({
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data.filter((post) => post.status === status),
        })),
        pageParams: data.pageParams,
      }),
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
      ...optimistic.deleteList({
        queryClient,
        queryKey: queryKeys.posts.seller(),
        idSelector: (id: string) => id,
        onSuccess: () => toast.success('پست با موفقیت حذف شد'),
        onError: () => toast.error(ERROR_MESSAGES.posts.deleteFailed),
        onSettled: () => queryCacheFactory.posts.invalidateSeller(queryClient),
      }),
    });
  },

  useDeleteUploadSessionPhoto() {
    return useMutation({
      mutationFn: deleteUploadSessionPhoto,
      onSuccess: (_data, { mediaId }) => {
        useMediaStore.getState().removeItem(mediaId);
        toast.success(ERROR_MESSAGES.posts.imageDeleteSuccess);
      },
      onError: () => {
        toast.error(ERROR_MESSAGES.posts.deleteFailed);
      },
    });
  },
};
