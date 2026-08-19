import { useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/lib/utils';

export interface FeedPostOwner {
  shopName: string;
  username: string;
  profileUrl: string | null;
}

export interface FeedPostMedia {
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
  altText: string | null;
  createdAt: string;
  updatedAt: string;
  url: string | null;
}

export interface BackendFeedPost {
  id: string;
  sellerId: string;
  description: string;
  productName: string | null;
  productImageUrl: string | null;
  productLink: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: FeedPostOwner;
  media?: FeedPostMedia[];
}

export interface FeedCursorPaginatedResult {
  data: BackendFeedPost[];
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
  };
}

export async function fetchFeedPosts(
  cursor?: string | null,
  limit: number = 15
): Promise<FeedCursorPaginatedResult> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const res = await http.get<{
    success: boolean;
    data: BackendFeedPost[];
    pagination?: { nextCursor: string | null; hasNext: boolean };
  }>('/posts/feed', { searchParams: params });

  return {
    data: res.data || [],
    pagination: {
      nextCursor: res.pagination?.nextCursor ?? null,
      hasNext: res.pagination?.hasNext ?? false,
    },
  };
}

export function useInfiniteFeedPosts(limit: number = 15) {
  const query = useInfiniteQuery({
    queryKey: ['posts', 'feed', 'infinite', limit],
    queryFn: ({ pageParam }) => fetchFeedPosts(pageParam as string | null, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      posts: data.pages.flatMap((page) => page.data),
    }),
  });

  return {
    ...query,
    posts: query.data?.posts ?? [],
  };
}
