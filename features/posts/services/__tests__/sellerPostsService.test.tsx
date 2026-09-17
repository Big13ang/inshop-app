import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  fetchApprovedPostsBySeller,
  fetchApprovedPostsByUsername,
  useApprovedPostsBySeller,
  useInfinitePostsByUsername,
} from '../sellerPostsService';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('sellerPostsService', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('fetchApprovedPostsBySeller & useApprovedPostsBySeller', () => {
    it('fetches approved posts by seller ID with cursor pagination', async () => {
      server.use(
        http.get('*/posts/seller/:sellerId', ({ request, params }) => {
          if (params.sellerId === 'seller-99') {
            const url = new URL(request.url);
            const limit = url.searchParams.get('limit');
            return HttpResponse.json({
              data: [
                { id: 'post-1', description: 'Post 1', status: 'APPROVED' },
              ],
              pagination: {
                nextCursor: 'cursor-2',
                hasNext: true,
                limit: Number(limit),
              },
            });
          }
          return new HttpResponse(null, { status: 404 });
        })
      );

      const result = await fetchApprovedPostsBySeller('seller-99', null, 10);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('post-1');
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.nextCursor).toBe('cursor-2');
    });

    it('useApprovedPostsBySeller hook returns paginated result', async () => {
      server.use(
        http.get('*/posts/seller/:sellerId', () => {
          return HttpResponse.json({
            data: [
              { id: 'post-hook-1', description: 'Hook Post', status: 'APPROVED' },
            ],
            pagination: { nextCursor: null, hasNext: false },
          });
        })
      );

      const { result } = renderHook(() => useApprovedPostsBySeller('seller-99'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0].id).toBe('post-hook-1');
    });
  });

  describe('fetchApprovedPostsByUsername & useInfinitePostsByUsername', () => {
    it('fetches approved posts by username', async () => {
      server.use(
        http.get('*/posts/seller/username/:username', ({ params }) => {
          if (params.username === 'shik_show') {
            return HttpResponse.json({
              data: {
                shop: { username: 'shik_show', shopName: 'Shik Show' },
                products: [
                  { id: 'post-user-1', description: 'Username Post', status: 'APPROVED' },
                ],
                pagination: { nextCursor: null, hasNext: false },
              },
            });
          }
          return new HttpResponse(null, { status: 404 });
        })
      );

      const result = await fetchApprovedPostsByUsername('shik_show');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('post-user-1');
      expect(result.pagination.hasNext).toBe(false);
    });

    it('useInfinitePostsByUsername hook returns infinite pages', async () => {
      server.use(
        http.get('*/posts/seller/username/:username', () => {
          return HttpResponse.json({
            data: {
              shop: { username: 'shik_show', shopName: 'Shik Show' },
              products: [
                { id: 'inf-post-1', description: 'Infinite Post', status: 'APPROVED' },
              ],
              pagination: { nextCursor: 'next-page', hasNext: true },
            },
          });
        })
      );

      const { result } = renderHook(() => useInfinitePostsByUsername('shik_show'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0].data[0].id).toBe('inf-post-1');
      expect(result.current.hasNextPage).toBe(true);
    });
  });
});
