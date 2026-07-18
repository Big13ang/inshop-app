import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/utils';
import { queryCacheFactory, queryKeys } from '@/lib/query-keys';
import { optimistic } from '@/lib/optimistic';
import { useUser } from '@/features/profile/context/UserContext';
import type { UserProfile } from '@/features/profile/services/profileService';
import type { PendingPost } from '../pending/types';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

export interface UploadSessionData {
  uploadSessionId: string;
  expiresAt: string;
}

export interface SubmitPostPayload {
  uploadSessionId: string;
  description: string;
  mediaIds?: string[];
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
}

interface CursorPaginatedResult<T> {
  data: T[];
  pagination: { nextCursor: string | null; hasNext: boolean };
}

function getUserInstagramId(user: UserProfile): string | null {
  return user.businessData?.instagramId || null;
}

function mapBackendPost(post: BackendPost, user: UserProfile): PendingPost {
  return {
    ...post,
    sellerName: getUserInstagramId(user) || user.name,
    sellerAvatar: '',
    isVerified: user.isVerifiedSeller,
  };
}

export const postsQueryService = {
  usePendingPosts() {
    const { user } = useUser();

    return useQuery<PendingPost[]>({
      queryKey: queryKeys.posts.pending(),
      queryFn: async () => {
        if (!user) return [];
        const res = await http.get<CursorPaginatedResult<BackendPost>>(
          '/seller/posts'
        );
        if (!res.ok) throw new Error(res.error.message);

        return res.value.data.map((post) => mapBackendPost(post, user));
      },
      enabled: !!user,
    });
  },

  useSubmitPost(onSuccess: () => void) {
    return useMutation({
      mutationFn: async (payload: SubmitPostPayload) => {
        const res = await http.post(
          '/upload-sessions/publish',
          payload
        );
        if (!res.ok) throw new Error(res.error.message);
      },
      onSuccess,
      onError: () => {
        toast.error(ERROR_MESSAGES.posts.submitFailed);
      },
    });
  },

  useDeletePendingPost() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        const res = await http.delete(`/seller/posts/${id}`);
        if (!res.ok) throw new Error(res.error.message);
      },
      ...optimistic.deleteList({
        queryClient,
        queryKey: queryKeys.posts.pending(),
        idSelector: (id: string) => id,
        onSuccess: () => toast.success('پست با موفقیت حذف شد'),
        onError: () => toast.error(ERROR_MESSAGES.posts.deleteFailed),
        onSettled: () => queryCacheFactory.posts.invalidatePending(queryClient),
      }),
    });
  },
};
