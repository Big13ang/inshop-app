import { useQuery } from '@tanstack/react-query';
import { http, type ApiResponse } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { useUser } from '@/features/profile/context/UserContext';
import type { SellerPost } from '@/features/posts/types';

export async function fetchPendingRejectedPosts(): Promise<SellerPost[]> {
  const res = await http.get<ApiResponse<SellerPost[]>>(
    '/seller/posts/pending-rejected'
  );
  return res.data || [];
}

export function usePendingRejectedPosts(options?: { enabled?: boolean }) {
  const { user } = useUser();
  const isEnabled = (options?.enabled ?? true) && !!user;

  return useQuery<SellerPost[]>({
    queryKey: [...queryKeys.posts.seller(), 'pending-rejected'],
    queryFn: fetchPendingRejectedPosts,
    enabled: isEnabled,
  });
}
