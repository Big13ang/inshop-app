import { useInfiniteQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { http, Result } from '@/lib/utils';
import { HTTPError } from 'ky';


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
  thumbnailStorageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  altText: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl: string;
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

export function isClientHttpError(error: unknown): boolean {
  if (error instanceof HTTPError) {
    return error.response.status >= 400 && error.response.status < 500;
  }
  const status =
    (error as { status?: number; response?: { status?: number } })?.status ??
    (error as { response?: { status?: number } })?.response?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

/**
 * Detects whether an error indicates that the feed session token or pagination cursor
 * is no longer valid on the server.
 *
 * - 400 (FEED.SESSION_EXPIRED / INVALID_CURSOR): The 24-hour feed session snapshot expired or the cursor format was invalid.
 * - 404 (FEED.SESSION_NOT_FOUND): The session was created under a different authentication context
 *   (e.g., user was logged in when page 1 loaded, then logged out / session expired before page 2 was requested).
 *
 * Recognizing both 400 and 404 enables TanStack Query to reset the query back to initialPageParam (null)
 * and recover cleanly from page 1 instead of remaining permanently stuck on a dead cursor.
 */
export function isFeedSessionExpiredError(error: unknown): boolean {
  if (error instanceof HTTPError) {
    return error.response.status === 400 || error.response.status === 404;
  }
  const status =
    (error as { status?: number; response?: { status?: number } })?.status ??
    (error as { response?: { status?: number } })?.response?.status;
  if (status === 400 || status === 404) return true;
  if (error instanceof Error) {
    return (
      error.message.includes('FEED.SESSION_EXPIRED') ||
      error.message.includes('FEED.SESSION_NOT_FOUND') ||
      error.message.includes('منقضی') ||
      error.message.includes('در دسترس نیست') ||
      error.message.includes('no longer available') ||
      error.message.includes('INVALID_CURSOR')
    );
  }
  return false;
}

export function shouldRetryFeed(failureCount: number, error: unknown): boolean {
  if (isClientHttpError(error)) {
    return false;
  }
  return failureCount < 2;
}

export async function fetchFeedPosts(
  cursor?: string | null,
  limit: number = 15
): Promise<FeedCursorPaginatedResult> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const result = await Result.try(
    http.get<{
      success: boolean;
      data: BackendFeedPost[];
      pagination?: { nextCursor: string | null; hasNext: boolean };
    }>('/posts/feed', { searchParams: params })
  );

  const res = Result.unwrap(result);

  return {
    data: res.data || [],
    pagination: {
      nextCursor: res.pagination?.nextCursor ?? null,
      hasNext: res.pagination?.hasNext ?? false,
    },
  };
}

export function useInfiniteFeedPosts(limit: number = 15) {
  const queryClient = useQueryClient();
  const queryKey = ['posts', 'feed', 'infinite', limit];

  const resetFeed = () => {
    return queryClient.resetQueries({ queryKey });
  };

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await Result.try(fetchFeedPosts(pageParam as string | null, limit));
      if (!result.ok) {
        const error = result.error;
        if (pageParam && isFeedSessionExpiredError(error)) {
          queryClient.resetQueries({ queryKey });
        }
        throw error;
      }
      return result.value;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined,
    retry: shouldRetryFeed,
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
    resetFeed,
  };
}

export function getCachedFeedPosts(queryClient: QueryClient): BackendFeedPost[] {
  return queryClient
    .getQueriesData<{ pages?: Array<{ data?: BackendFeedPost[] }> }>({ queryKey: ['posts', 'feed'] })
    .flatMap(([, data]) => data?.pages?.flatMap((page) => page.data ?? []) ?? []);
}

