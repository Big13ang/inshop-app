import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import type { PendingPost } from '../types';
import { text } from '../constants';

async function deletePost(id: string): Promise<void> {
  const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`${res.status}`);
}

export function useDeletePendingPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onMutate: async (id: string) => {
      const pendingKey = queryKeys.posts.pending();
      await queryClient.cancelQueries({ queryKey: pendingKey });
      const previous = queryClient.getQueryData<PendingPost[]>(pendingKey);
      queryClient.setQueryData<PendingPost[]>(pendingKey, (current) =>
        current?.filter((post) => post.id !== id),
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success(text.deleteSuccess);
    },
    onError: (_err, _id, context) => {
      const pendingKey = queryKeys.posts.pending();
      if (context?.previous) {
        queryClient.setQueryData(pendingKey, context.previous);
      }
      toast.error(text.deleteError);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.pending() });
    },
  });
}
