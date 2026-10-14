import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http, type ApiResponse } from '@/lib/utils';
import { queryCacheFactory } from '@/lib/query-keys';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { postAnalytics } from '@/features/posts/analytics/postAnalytics';

export interface SubmitPostPayload {
  uploadSessionId: string;
  description: string;
  mediaIds: string[];
}

export interface PublishPostResponse {
  postId: string;
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

export function useSubmitPost(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitPostPayload) => {
      const res = await http.post<ApiResponse<PublishPostResponse>>(
        '/upload-sessions/publish',
        payload
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryCacheFactory.posts.invalidateSeller(queryClient);
      postAnalytics.submitProduct(data.postId);
      onSuccess?.();
    },
    onError: () => {
      toast.error(ERROR_MESSAGES.posts.submitFailed);
    },
  });
}

export function useDeleteUploadSessionPhoto() {
  return useMutation({
    mutationFn: deleteUploadSessionPhoto,
    onSuccess: () => {
      toast.success(ERROR_MESSAGES.posts.imageDeleteSuccess);
    },
    onError: () => {
      toast.error(ERROR_MESSAGES.posts.deleteFailed);
    },
  });
}
