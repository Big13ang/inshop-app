import { useInfiniteQuery } from '@tanstack/react-query';
import { authHttp, Result } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import type { SellerPost, CursorPaginatedResult } from '@/features/posts/types';

export interface ViewedPostItem {
  post: SellerPost;
  viewedAt: string;
  viewCount: number;
}

export interface ViewedPostsResponse {
  data: ViewedPostItem[];
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
  };
}

export async function fetchViewedPosts(
  cursor?: string | null,
  limit: number = 20
): Promise<CursorPaginatedResult<SellerPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const result = await Result.try(
    authHttp.get<ViewedPostsResponse>('/posts/feed/viewed', {
      searchParams: params,
    })
  );

  if (!result.ok || !result.value?.data) {
    return {
      data: [],
      pagination: {
        nextCursor: null,
        hasNext: false,
      },
    };
  }

  const { data, pagination } = result.value;

  return {
    data: data.map((item) => item.post),
    pagination: {
      nextCursor: pagination?.nextCursor ?? null,
      hasNext: Boolean(pagination?.hasNext),
    },
  };
}

export function useInfiniteViewedPosts(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts.viewed(), 'infinite', limit],
    queryFn: ({ pageParam }) =>
      fetchViewedPosts(pageParam as string | null, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
    staleTime: 1000 * 60 * 5,
  });
}
