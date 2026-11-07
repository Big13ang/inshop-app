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
  // Direct leaf category ids (1 to 3). Omitted when the seller picked none.
  categoryIds?: string[];
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

const BACKEND_MESSAGE_STATUSES = [400, 409];

// The backend answers validation (400) and conflict (409) failures with a translated message
// (invalid category count, category not selectable, concurrent change...). Show that one.
// Network and server errors keep the generic message, since their text is not meant for users.
function getPublishErrorMessage(error: Error): string {
  const status = (error as { response?: { status?: number } }).response?.status;
  const hasBackendMessage = status !== undefined && BACKEND_MESSAGE_STATUSES.includes(status);
  return hasBackendMessage && error.message ? error.message : ERROR_MESSAGES.posts.submitFailed;
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
    onError: (error) => {
      toast.error(getPublishErrorMessage(error));
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
