import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http as httpMock, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { postsQueryService, POST_STATUS } from '../postsQueryService';
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

const sellerInfo = { id: 'seller-1', name: 'Test Seller', isVerifiedSeller: true };

const backendPosts = {
  data: [
    {
      id: 'post-1',
      sellerId: 'seller-1',
      description: 'Pending caption',
      status: 'PENDING_REVIEW',
      rejectReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: 'post-2',
      sellerId: 'seller-1',
      description: 'Approved caption',
      status: 'APPROVED',
      rejectReason: null,
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      reviewedBy: 'admin-1',
      reviewedAt: '2026-01-02T12:00:00.000Z',
    },
    {
      id: 'post-3',
      sellerId: 'seller-1',
      description: 'Rejected caption',
      status: 'REJECTED',
      rejectReason: 'Image quality too low',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T12:00:00.000Z',
      reviewedBy: 'admin-1',
      reviewedAt: '2026-01-03T12:00:00.000Z',
    },
  ],
  pagination: { nextCursor: null, hasNext: false },
};

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
    it('fetches from /seller/posts and maps backend status to frontend status', async () => {
      server.use(
        httpMock.get('*/seller/posts', () => HttpResponse.json({ success: true, ...backendPosts })),
        httpMock.get('*/me', () => HttpResponse.json({ success: true, data: sellerInfo })),
      );

      const { result } = renderHook(() => postsQueryService.usePendingPosts(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const posts = result.current.data!;
      expect(posts).toHaveLength(3);
      expect(posts[0].status).toBe(POST_STATUS.PENDING_REVIEW);
      expect(posts[0].description).toBe('Pending caption');
      expect(posts[0].sellerName).toBe('Test Seller');
      expect(posts[0].isVerified).toBe(true);
      expect(posts[1].status).toBe(POST_STATUS.APPROVED);
      expect(posts[2].status).toBe(POST_STATUS.REJECTED);
      expect(posts[2].rejectReason).toBe('Image quality too low');
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
        sellerId: 'seller-a',
        description: 'Caption A',
        media: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        status: POST_STATUS.PENDING_REVIEW,
        rejectReason: null,
        reviewedBy: null,
        reviewedAt: null,
        sellerName: 'Seller A',
        sellerAvatar: '',
        isVerified: false,
      },
      {
        id: 'b',
        sellerId: 'seller-b',
        description: 'Caption B',
        media: [],
        createdAt: '2026-01-02',
        updatedAt: '2026-01-02',
        status: POST_STATUS.REJECTED,
        rejectReason: 'Some reason',
        reviewedBy: 'admin-1',
        reviewedAt: '2026-01-02',
        sellerName: 'Seller B',
        sellerAvatar: '',
        isVerified: true,
      },
    ];

    it('optimistically removes the post from cache and invalidates query on success', async () => {
      server.use(
        httpMock.delete('*/seller/posts/:id', ({ params }) => {
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
        httpMock.delete('*/seller/posts/:id', () => {
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

      const cached = queryClient.getQueryData<PendingPost[]>(queryKeys.posts.pending());
      expect(cached?.map(p => p.id)).toEqual(['a', 'b']);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
