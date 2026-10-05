import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fetchViewedPosts,
  recordFeedEvent,
  useRecordFeedEventMutation,
  usePassiveFeedEvent,
  RECOMMENDATION_EVENT_TYPE,
} from '../viewedPostsService';
import { authHttp } from '@/lib/utils';
import type { SellerPost } from '@/features/posts/types';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    authHttp: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };
});

describe('viewedPostsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPosts: SellerPost[] = [
    {
      id: 'post-1',
      sellerId: 's-1',
      description: 'First viewed item',
      status: 'APPROVED',
      rejectReason: null,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
      reviewedBy: 'admin',
      reviewedAt: '2026-10-01T10:00:00Z',
      media: [],
    },
    {
      id: 'post-2',
      sellerId: 's-1',
      description: 'Second viewed item',
      status: 'APPROVED',
      rejectReason: null,
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T10:00:00Z',
      reviewedBy: 'admin',
      reviewedAt: '2026-10-02T10:00:00Z',
      media: [],
    },
  ];

  describe('fetchViewedPosts', () => {
    it('parses viewed posts response correctly', async () => {
      (authHttp.get as jest.Mock).mockResolvedValueOnce({
        data: mockPosts.map((post) => ({
          post,
          viewedAt: '2026-10-04T12:00:00.000Z',
          viewCount: 1,
        })),
        pagination: {
          nextCursor: 'cursor-123',
          hasNext: true,
        },
      });

      const result = await fetchViewedPosts('cursor-abc', 10);

      expect(authHttp.get).toHaveBeenCalledWith('/posts/feed/viewed', {
        searchParams: expect.any(URLSearchParams),
      });
      expect(result.data).toEqual(mockPosts);
      expect(result.pagination.nextCursor).toBe('cursor-123');
      expect(result.pagination.hasNext).toBe(true);
    });

    it('safely handles error and returns empty data without throwing', async () => {
      (authHttp.get as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      const result = await fetchViewedPosts();

      expect(result.data).toEqual([]);
      expect(result.pagination.nextCursor).toBeNull();
      expect(result.pagination.hasNext).toBe(false);
    });
  });

  describe('recordFeedEvent', () => {
    it('sends POST /posts/feed/events for OPEN event with exact payload', async () => {
      (authHttp.post as jest.Mock).mockResolvedValueOnce({ recorded: true });

      const result = await recordFeedEvent({
        postId: 'post-uuid-123',
        eventType: RECOMMENDATION_EVENT_TYPE.OPEN,
      });

      expect(authHttp.post).toHaveBeenCalledWith('/posts/feed/events', {
        postId: 'post-uuid-123',
        eventType: 'OPEN',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ recorded: true });
      }
    });

    it('sends POST /posts/feed/events for active CONTACT event', async () => {
      (authHttp.post as jest.Mock).mockResolvedValueOnce({ recorded: true });

      const result = await recordFeedEvent({
        postId: 'post-uuid-123',
        eventType: RECOMMENDATION_EVENT_TYPE.CONTACT,
      });

      expect(authHttp.post).toHaveBeenCalledWith('/posts/feed/events', {
        postId: 'post-uuid-123',
        eventType: 'CONTACT',
      });
      expect(result.ok).toBe(true);
    });

    it('includes sessionToken if provided', async () => {
      (authHttp.post as jest.Mock).mockResolvedValueOnce({ recorded: true });

      await recordFeedEvent({
        postId: 'post-uuid-123',
        eventType: RECOMMENDATION_EVENT_TYPE.OPEN,
        sessionToken: 'session-token-456',
      });

      expect(authHttp.post).toHaveBeenCalledWith('/posts/feed/events', {
        postId: 'post-uuid-123',
        eventType: 'OPEN',
        sessionToken: 'session-token-456',
      });
    });

    it('safely captures errors via Result pattern without throwing', async () => {
      (authHttp.post as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      const result = await recordFeedEvent({
        postId: 'post-uuid-123',
        eventType: RECOMMENDATION_EVENT_TYPE.OPEN,
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('useRecordFeedEventMutation', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
    });

    const createWrapper = () => {
      return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );
      };
    };

    it('successfully triggers mutation and invalidates viewed posts for OPEN event', async () => {
      (authHttp.post as jest.Mock).mockResolvedValueOnce({ recorded: true });
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRecordFeedEventMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        postId: 'post-123',
        eventType: RECOMMENDATION_EVENT_TYPE.OPEN,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authHttp.post).toHaveBeenCalledWith('/posts/feed/events', {
        postId: 'post-123',
        eventType: 'OPEN',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['posts', 'viewed'],
      });
    });

    it('triggers mutation for CONTACT event without invalidating viewed posts', async () => {
      (authHttp.post as jest.Mock).mockResolvedValueOnce({ recorded: true });
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRecordFeedEventMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        postId: 'post-123',
        eventType: RECOMMENDATION_EVENT_TYPE.CONTACT,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authHttp.post).toHaveBeenCalledWith('/posts/feed/events', {
        postId: 'post-123',
        eventType: 'CONTACT',
      });
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('usePassiveFeedEvent', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
    });

    const createWrapper = () => {
      return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );
      };
    };

    it('passively executes via useQuery when postId and eventType are present', async () => {
      (authHttp.post as jest.Mock).mockResolvedValueOnce({ recorded: true });
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () =>
          usePassiveFeedEvent({
            postId: 'post-456',
            eventType: RECOMMENDATION_EVENT_TYPE.OPEN,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authHttp.post).toHaveBeenCalledWith('/posts/feed/events', {
        postId: 'post-456',
        eventType: 'OPEN',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['posts', 'viewed'],
      });
    });

    it('does not execute when enabled is false or postId is absent', async () => {
      const { result } = renderHook(
        () =>
          usePassiveFeedEvent(
            {
              postId: undefined,
              eventType: RECOMMENDATION_EVENT_TYPE.OPEN,
            },
            { enabled: false }
          ),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(authHttp.post).not.toHaveBeenCalled();
    });
  });
});
