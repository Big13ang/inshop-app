import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/env';
import { http } from '@/lib/utils';
import { queryCacheFactory, queryKeys } from '@/lib/query-keys';
import { optimistic } from '@/lib/optimistic';
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

export const postsQueryService = {
  usePendingPosts() {
    return useQuery<PendingPost[]>({
      queryKey: queryKeys.posts.pending(),
      queryFn: async () => {
        const res = await http.get<PendingPost[]>('/api/posts');
        if (!res.ok) throw new Error(res.error.message);
        return res.value.filter((post) => post.status !== 'approved');
      },
    });
  },

  useSubmitPost(onSuccess: () => void) {
    return useMutation({
      mutationFn: async (payload: SubmitPostPayload) => {
        const res = await http.post(
          `${env.NEXT_PUBLIC_API_URL}/upload-sessions/publish`,
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
        const res = await http.delete(`/api/posts/${id}`);
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
