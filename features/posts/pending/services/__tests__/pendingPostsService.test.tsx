import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  fetchPendingRejectedPosts,
  usePendingRejectedPosts,
} from '../pendingPostsService';

jest.mock('@/features/profile/context/UserContext', () => ({
  useUser: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('pendingPostsService', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetchPendingRejectedPosts fetches pending and rejected posts from API', async () => {
    server.use(
      http.get('*/seller/posts/pending-rejected', () => {
        return HttpResponse.json({
          data: [
            { id: 'pending-1', description: 'Pending Post', status: 'PENDING_REVIEW' },
          ],
        });
      })
    );

    const data = await fetchPendingRejectedPosts();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('pending-1');
  });

  it('usePendingRejectedPosts hook queries data successfully when user is logged in', async () => {
    server.use(
      http.get('*/seller/posts/pending-rejected', () => {
        return HttpResponse.json({
          data: [
            { id: 'pending-hook-1', description: 'Pending Hook Post', status: 'PENDING_REVIEW' },
          ],
        });
      })
    );

    const { result } = renderHook(() => usePendingRejectedPosts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('pending-hook-1');
  });
});
