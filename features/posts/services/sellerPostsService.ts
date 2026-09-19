import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { http, type ApiResponse, type PaginatedApiResponse } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import type {
  SellerPost,
  SellerPostsByUsernameData,
  CursorPaginatedResult,
} from '@/features/posts/types';

export async function fetchApprovedPostsBySeller(
  sellerId: string,
  cursor?: string | null,
  limit: number = 12
): Promise<CursorPaginatedResult<SellerPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<PaginatedApiResponse<SellerPost>>(
    `/posts/seller/${encodeURIComponent(sellerId)}`,
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

export async function fetchApprovedPostsByUsername(
  username: string,
  cursor?: string | null,
  limit: number = 12
): Promise<CursorPaginatedResult<SellerPost>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  const res = await http.get<ApiResponse<SellerPostsByUsernameData>>(
    `/posts/seller/username/${encodeURIComponent(username)}`,
    { searchParams: params }
  );
  return {
    data: res.data?.products || [],
    pagination: {
      nextCursor: res.data?.pagination?.nextCursor ?? null,
      hasNext: res.data?.pagination?.hasNext ?? false,
    },
  };
}

export function useApprovedPostsBySeller(sellerId?: string, limit: number = 20) {
  return useQuery<CursorPaginatedResult<SellerPost>>({
    queryKey: [...queryKeys.posts.all, 'seller-approved', sellerId, limit],
    queryFn: () => fetchApprovedPostsBySeller(sellerId!, null, limit),
    enabled: !!sellerId,
  });
}

export function useInfinitePostsByUsername(username?: string, limit: number = 6) {
  const trimmed = (username || '').trim();

  return useInfiniteQuery({
    queryKey: [...queryKeys.posts.all, 'seller-username-infinite', trimmed, limit],
    queryFn: ({ pageParam }) =>
      fetchApprovedPostsByUsername(trimmed, pageParam as string | null, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
    enabled: Boolean(trimmed),
  });
}
