import { useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import type { SearchResponseDto, SearchApiResponse } from '../types';
import { cleanSearchQuery } from '../utils/searchSanitizer';
import { hashSearchKey } from '../utils/searchCache';

/**
 * Fetches search results matching public profiles and approved posts.
 * Requirements:
 * - q: query string with at least 3 characters
 * - cursor: optional pagination cursor for next post page
 * - limit: number of results between 1 and 100 (defaults to 20)
 */
export async function fetchSearchResults(
  query: string,
  cursor?: string | null,
  limit: number = 20
): Promise<SearchResponseDto> {
  const sanitizedQuery = cleanSearchQuery(query);

  if (sanitizedQuery.length < 3) {
    return {
      profiles: [],
      posts: [],
      pagination: { nextCursor: null, hasNext: false },
    };
  }

  const searchParams = new URLSearchParams({ q: sanitizedQuery });

  if (cursor) {
    searchParams.set('cursor', cursor);
  }
  if (limit) {
    searchParams.set('limit', String(limit));
  }

  const res = await http.get<SearchApiResponse>('/search', {
    searchParams,
  });

  const payload = res.data ?? res;

  return {
    profiles: payload.profiles ?? [],
    posts: payload.posts ?? [],
    pagination: {
      nextCursor: payload.pagination?.nextCursor ?? null,
      hasNext: Boolean(payload.pagination?.hasNext),
    },
  };
}

export function getNextSearchPageParam(
  lastPage: SearchResponseDto
): string | null | undefined {
  return lastPage.pagination?.hasNext ? lastPage.pagination.nextCursor : undefined;
}

export function useSearchQuery(query: string, limit: number = 20) {
  const sanitizedQuery = cleanSearchQuery(query);
  const hashedKey = hashSearchKey(sanitizedQuery);

  return useInfiniteQuery({
    queryKey: ['search', limit, hashedKey],
    queryFn: ({ pageParam }) => fetchSearchResults(sanitizedQuery, pageParam, limit),
    initialPageParam: null as string | null,
    getNextPageParam: getNextSearchPageParam,
    enabled: sanitizedQuery.length >= 3,
    staleTime: 60 * 1000,
  });
}
