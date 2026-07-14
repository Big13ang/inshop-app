import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http as httpMock, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { postsQueryService } from '../postsQueryService';
import { queryCacheFactory, queryKeys } from '@/lib/query-keys';
import type { PendingPost } from '../../pending/types';

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
import { toast } from 'sonner';

function createWrapper(client: QueryClient) {
  const QueryClientWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  QueryClientWrapper.displayName = 'QueryClientWrapper';
  return QueryClientWrapper;
}

describe('postsQueryService', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('usePendingPosts', () => {
    it('returns only pending and rejected posts (filters approved posts)', async () => {
      const mockPosts: PendingPost[] = [
        {
          id: '1',
          caption: 'Pending Post',
          mediaUrls: [],
          submittedAt: '2026-01-01',
          status: 'pending',
          title: 'Title 1',
          sellerName: 'Seller 1',
          sellerAvatar: '',
          isVerified: false,
        },
        {
          id: '2',
          caption: 'Approved Post',
          mediaUrls: [],
          submittedAt: '2026-01-02',
          status: 'approved',
          title: 'Title 2',
          sellerName: 'Seller 2',
          sellerAvatar: '',
          isVerified: false,
        },
        {
          id: '3',
          caption: 'Rejected Post',
          mediaUrls: [],
          submittedAt: '2026-01-03',
          status: 'rejected',
          title: 'Title 3',
          sellerName: 'Seller 3',
          sellerAvatar: '',
          isVerified: true,
        },
      ];

      server.use(
        httpMock.get('*/api/posts', () => {
          return HttpResponse.json(mockPosts);
        })
      );

      const { result } = renderHook(() => postsQueryService.usePendingPosts(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Approved post (id '2') should be filtered out
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.map(p => p.id)).toEqual(['1', '3']);
    });
  });

  describe('useSubmitPost', () => {
    it('calls publish endpoint successfully', async () => {
      let capturedPayload: unknown = null;
      server.use(
        httpMock.post('*/upload-sessions/publish', async ({ request }) => {
          capturedPayload = await request.json();
          return new HttpResponse(null, { status: 200 });
        })
      );

      const onSuccess = jest.fn();
      const { result } = renderHook(() => postsQueryService.useSubmitPost(onSuccess), {
        wrapper: createWrapper(queryClient),
      });

      const payload = { uploadSessionId: 'session-xyz', description: 'Hello world', mediaIds: ['media-1'] };
      
      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(capturedPayload).toEqual(payload);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('useDeletePendingPost', () => {
    const initialPosts: PendingPost[] = [
      {
        id: 'a',
        caption: 'Caption A',
        mediaUrls: [],
        submittedAt: '2026-01-01',
        status: 'pending',
        title: 'Title A',
        sellerName: 'Seller A',
        sellerAvatar: '',
        isVerified: false,
      },
      {
        id: 'b',
        caption: 'Caption B',
        mediaUrls: [],
        submittedAt: '2026-01-02',
        status: 'rejected',
        title: 'Title B',
        sellerName: 'Seller B',
        sellerAvatar: '',
        isVerified: true,
      },
    ];

    it('optimistically removes the post from cache and invalidates query on success', async () => {
      server.use(
        httpMock.delete('*/api/posts/:id', ({ params }) => {
          return HttpResponse.json({ id: params.id });
        })
      );

      queryClient.setQueryData(queryKeys.posts.pending(), initialPosts);
      const invalidateSpy = jest.spyOn(queryCacheFactory.posts, 'invalidatePending');

      const { result } = renderHook(() => postsQueryService.useDeletePendingPost(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate('a');
      });

      // Optimistic cache update check
      await waitFor(() => {
        const cached = queryClient.getQueryData<PendingPost[]>(queryKeys.posts.pending());
        expect(cached?.map(p => p.id)).toEqual(['b']);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith(queryClient);
      expect(toast.success).toHaveBeenCalled();
    });

    it('rolls back optimistic update and shows toast error on failure', async () => {
      server.use(
        httpMock.delete('*/api/posts/:id', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      queryClient.setQueryData(queryKeys.posts.pending(), initialPosts);

      const { result } = renderHook(() => postsQueryService.useDeletePendingPost(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate('a');
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Rollback verification
      const cached = queryClient.getQueryData<PendingPost[]>(queryKeys.posts.pending());
      expect(cached?.map(p => p.id)).toEqual(['a', 'b']);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
