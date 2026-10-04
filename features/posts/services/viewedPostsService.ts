import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { authHttp, Result } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import type { SellerPost, CursorPaginatedResult } from '@/features/posts/types';

export const RECOMMENDATION_EVENT_TYPE = {
  IMPRESSION: 'IMPRESSION',
  OPEN: 'OPEN',
  LIKE: 'LIKE',
  SAVE: 'SAVE',
  SHARE: 'SHARE',
  CONTACT: 'CONTACT',
  FOLLOW_SELLER: 'FOLLOW_SELLER',
  HIDE_PRODUCT: 'HIDE_PRODUCT',
  HIDE_SELLER: 'HIDE_SELLER',
  REPORT: 'REPORT',
  PURCHASE: 'PURCHASE',
  ADD_TO_CART: 'ADD_TO_CART',
  MESSAGE_SELLER: 'MESSAGE_SELLER',
} as const;

export type RecommendationEventType =
  (typeof RECOMMENDATION_EVENT_TYPE)[keyof typeof RECOMMENDATION_EVENT_TYPE];

export interface RecordFeedEventPayload {
  postId: string;
  eventType: RecommendationEventType;
  sessionToken?: string;
}

export interface RecordFeedEventResponse {
  recorded: boolean;
}

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

export async function recordFeedEvent(
  payload: RecordFeedEventPayload
): Promise<Result<RecordFeedEventResponse, Error>> {
  return Result.try(
    authHttp.post<RecordFeedEventResponse>('/posts/feed/events', payload)
  );
}

export function useRecordFeedEventMutation() {
  const queryClient = useQueryClient();

  const handleSuccess = (
    res: Result<RecordFeedEventResponse, Error>,
    variables: RecordFeedEventPayload
  ) => {
    if (res.ok && variables.eventType === RECOMMENDATION_EVENT_TYPE.OPEN) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.posts.viewed(),
      });
    }
  };

  return useMutation({
    mutationFn: (payload: RecordFeedEventPayload) => recordFeedEvent(payload),
    onSuccess: handleSuccess,
  });
}

export interface UsePassiveFeedEventOptions {
  enabled?: boolean;
}

export function usePassiveFeedEvent(
  payload?: Partial<RecordFeedEventPayload> & {
    postId?: string;
    eventType?: RecommendationEventType;
  },
  options?: UsePassiveFeedEventOptions
) {
  const queryClient = useQueryClient();
  const postId = payload?.postId;
  const eventType = payload?.eventType;
  const sessionToken = payload?.sessionToken;
  const isEnabled = Boolean(postId && eventType && (options?.enabled ?? true));

  const queryFn = async () => {
    if (!postId || !eventType) return null;

    const res = await recordFeedEvent({
      postId,
      eventType,
      sessionToken,
    });

    if (res.ok && eventType === RECOMMENDATION_EVENT_TYPE.OPEN) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.posts.viewed(),
      });
    }

    return res;
  };

  return useQuery({
    queryKey:
      isEnabled && postId && eventType
        ? queryKeys.posts.event(postId, eventType, sessionToken)
        : (['posts', 'events', 'disabled'] as const),
    queryFn,
    enabled: isEnabled,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
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
