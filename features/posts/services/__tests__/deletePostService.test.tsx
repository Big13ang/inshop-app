import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { server } from '@/mocks/server';
import { queryKeys } from '@/lib/query-keys';
import { useDeletePendingPost } from '../deletePostService';
import type { SellerPost, SellerPostsByUsernameData } from '@/features/posts/types';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

function createMockSellerPost(overrides: Partial<SellerPost> = {}): SellerPost {
  return {
    id: 'post-123',
    sellerId: 'seller-1',
    description: 'Test post description',
    status: 'APPROVED',
    rejectReason: null,
    createdAt: '2026-09-17T12:00:00Z',
    updatedAt: '2026-09-17T12:00:00Z',
    reviewedBy: null,
    reviewedAt: null,
    ...overrides,
  };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('useDeletePendingPost (deletePostService)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('optimistically clears post from all caches and invalidates queries on delete', async () => {
    let deleteCalled = false;
    server.use(
      http.delete('*/seller/posts/:id', ({ params }) => {
        if (params.id === 'post-123') {
          deleteCalled = true;
          return new HttpResponse(null, { status: 200 });
        }
        return new HttpResponse(null, { status: 404 });
      })
    );

    const post1 = createMockSellerPost({ id: 'post-123' });
    const post2 = createMockSellerPost({ id: 'post-456' });

    // 1. Pre-populate infinite seller-username cache
    queryClient.setQueryData(
      [...queryKeys.posts.all, 'seller-username-infinite', 'shik_show', 6],
      {
        pages: [{ data: [post1, post2], pagination: { nextCursor: null, hasNext: false } }],
        pageParams: [null],
      }
    );

    // 2. Pre-populate user profile cache (GET /posts/seller/username/:username)
    queryClient.setQueryData<SellerPostsByUsernameData>(
      queryKeys.user.byUsername('shik_show'),
      {
        shop: { username: 'shik_show', shopName: 'Shik Show' },
        products: [post1, post2],
      }
    );

    // 3. Pre-populate feed cache
    queryClient.setQueryData(
      ['posts', 'feed', 'infinite', 15],
      {
        pages: [{ data: [post1, post2], pagination: { nextCursor: null, hasNext: false } }],
        pageParams: [null],
      }
    );

    // 4. Pre-populate pending-rejected cache
    queryClient.setQueryData(
      [...queryKeys.posts.seller(), 'pending-rejected'],
      [post1, post2]
    );

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeletePendingPost(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('post-123');
    });

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });

    // Verify infinite seller-username cache was cleaned
    const sellerInfiniteData = queryClient.getQueryData<{
      pages: { data: SellerPost[] }[];
    }>([...queryKeys.posts.all, 'seller-username-infinite', 'shik_show', 6]);
    expect(sellerInfiniteData?.pages[0].data).toEqual([post2]);

    // Verify user profile cache was cleaned
    const userProfileData = queryClient.getQueryData<SellerPostsByUsernameData>(
      queryKeys.user.byUsername('shik_show')
    );
    expect(userProfileData?.products).toEqual([post2]);

    // Verify feed cache was cleaned
    const feedData = queryClient.getQueryData<{
      pages: { data: SellerPost[] }[];
    }>(['posts', 'feed', 'infinite', 15]);
    expect(feedData?.pages[0].data).toEqual([post2]);

    // Verify pending-rejected cache was cleaned
    const pendingData = queryClient.getQueryData<SellerPost[]>([
      ...queryKeys.posts.seller(),
      'pending-rejected',
    ]);
    expect(pendingData).toEqual([post2]);

    // Verify invalidation calls and sequence
    const invalidationOrder = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidationOrder).toContainEqual([...queryKeys.posts.seller(), 'pending-rejected']);
    expect(invalidationOrder).toContainEqual(queryKeys.user.profile);
    expect(invalidationOrder).toContainEqual(queryKeys.posts.all);

    expect(toast.success).toHaveBeenCalledWith('پست با موفقیت حذف شد');
  });

  it('rolls back optimistic updates when deletion fails with server error', async () => {
    server.use(
      http.delete('*/seller/posts/:id', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const post1 = createMockSellerPost({ id: 'post-123' });
    const post2 = createMockSellerPost({ id: 'post-456' });

    queryClient.setQueryData(
      [...queryKeys.posts.all, 'seller-username-infinite', 'shik_show', 6],
      {
        pages: [{ data: [post1, post2], pagination: { nextCursor: null, hasNext: false } }],
        pageParams: [null],
      }
    );
    queryClient.setQueryData<SellerPostsByUsernameData>(
      queryKeys.user.byUsername('shik_show'),
      {
        shop: { username: 'shik_show', shopName: 'Shik Show' },
        products: [post1, post2],
      }
    );

    const { result } = renderHook(() => useDeletePendingPost(), {
      wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('post-123');
      } catch {
        // expected error
      }
    });

    // Check that rollback restored both posts in the caches
    const sellerInfiniteData = queryClient.getQueryData<{
      pages: { data: SellerPost[] }[];
    }>([...queryKeys.posts.all, 'seller-username-infinite', 'shik_show', 6]);
    expect(sellerInfiniteData?.pages[0].data).toEqual([post1, post2]);

    const userProfileData = queryClient.getQueryData<SellerPostsByUsernameData>(
      queryKeys.user.byUsername('shik_show')
    );
    expect(userProfileData?.products).toEqual([post1, post2]);

    expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.posts.deleteFailed);
  });
});
