import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, type ApiResponse } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import type { PostEdit, PostEditUpdateResult } from '@/features/post-edit/types';

export async function getPostForEdit(postId: string): Promise<PostEdit> {
  const res = await http.get<ApiResponse<PostEdit>>(`/seller/posts/${encodeURIComponent(postId)}`);
  return res.data;
}

export async function updatePostDescription(postId: string, description: string): Promise<PostEditUpdateResult> {
  const res = await http.patch<ApiResponse<PostEditUpdateResult>>(
    `/seller/posts/${encodeURIComponent(postId)}`,
    { description },
  );
  return res.data;
}

export function usePostForEdit(postId: string) {
  return useQuery({
    queryKey: [...queryKeys.posts.all, 'edit', postId],
    queryFn: () => getPostForEdit(postId),
  });
}

export function useUpdatePostDescription(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description: string) => updatePostDescription(postId, description),
    onSuccess: () => {
      // Every post query lives under the posts prefix: this post, the seller's lists,
      // the feed and the public views. Reset rather than invalidate: the feed pages through
      // a server snapshot, and refetching replays the old cursor and returns the old list.
      // A reset starts a new snapshot, the same as pull-to-refresh. The user profile holds
      // its own post lists.
      void queryClient.resetQueries({ queryKey: queryKeys.posts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });
}
