import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { http, type PaginatedApiResponse } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { useUser } from '@/features/profile/context/UserContext';
import type { SellerPost, CursorPaginatedResult } from '@/features/posts/types';

export async function fetchPendingRejectedPosts(
  cursor?: string | null,
  limit: number = 20
): Promise<CursorPaginatedResult<SellerPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<PaginatedApiResponse<SellerPost>>(
    '/seller/posts/pending-rejected',
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

export function usePendingRejectedPosts(options?: { enabled?: boolean }) {
  const { user } = useUser();
  const isEnabled = (options?.enabled ?? true) && !!user;

  return useQuery<SellerPost[]>({
    queryKey: [...queryKeys.posts.seller(), 'pending-rejected'],
    queryFn: async () => {
      const res = await fetchPendingRejectedPosts(null, 20);
      return res.data;
    },
    enabled: isEnabled,
  });
}

export interface UseInfinitePendingRejectedPostsOptions {
  enabled?: boolean;
  limit?: number;
}

export function useInfinitePendingRejectedPosts(
  options?: UseInfinitePendingRejectedPostsOptions
) {
  const { user } = useUser();
  const limit = options?.limit ?? 20;
  const isEnabled = (options?.enabled ?? true) && !!user;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.posts.seller(), 'pending-rejected', 'infinite', limit],
    queryFn: ({ pageParam }) =>
      fetchPendingRejectedPosts(pageParam as string | null, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
    enabled: isEnabled,
  });

  const posts = query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    posts,
  };
}

