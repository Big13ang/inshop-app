import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../mocks/server';
import { useDeletePendingPost } from '../hooks/useDeletePendingPost';
import { queryKeys } from '@/lib/query-keys';
import type { PendingPost } from '../types';

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
import { toast } from 'sonner';

const posts: PendingPost[] = [
  {
    id: 'a',
    caption: 'a',
    mediaUrls: [],
    submittedAt: '2026-01-01',
    status: 'pending',
    title: 'title-a',
    sellerName: 'seller-a',
    sellerAvatar: 'avatar-a',
    isVerified: true,
  },
  {
    id: 'b',
    caption: 'b',
    mediaUrls: [],
    submittedAt: '2026-01-01',
    status: 'rejected',
    title: 'title-b',
    sellerName: 'seller-b',
    sellerAvatar: 'avatar-b',
    isVerified: false,
  },
];

function renderWithClient() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(queryKeys.posts.pending(), posts);
  const { result } = renderHook(() => useDeletePendingPost(), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  return { result, client };
}

afterEach(() => jest.clearAllMocks());

describe('useDeletePendingPost', () => {
  it('optimistically removes the post from the cache', async () => {
    server.use(http.delete('/api/posts/:id', ({ params }) => HttpResponse.json({ id: params.id })));
    const { result, client } = renderWithClient();

    act(() => {
      result.current.mutate('a');
    });

    await waitFor(() => {
      const cached = client.getQueryData<PendingPost[]>(queryKeys.posts.pending());
      expect(cached?.map((p) => p.id)).toEqual(['b']);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back and shows an error toast when the request fails', async () => {
    server.use(http.delete('/api/posts/:id', () => new HttpResponse(null, { status: 404 })));
    const { result, client } = renderWithClient();

    act(() => {
      result.current.mutate('a');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = client.getQueryData<PendingPost[]>(queryKeys.posts.pending());
    expect(cached?.map((p) => p.id)).toEqual(['a', 'b']);
    expect(toast.error).toHaveBeenCalled();
  });
});
