import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../mocks/server';
import { usePendingPosts } from '../hooks/usePendingPosts';

function renderWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => usePendingPosts(), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

describe('usePendingPosts', () => {
  it('returns the seeded pending and rejected posts', async () => {
    const { result } = renderWithClient();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.map((p) => p.status)).toEqual(['pending', 'rejected', 'rejected']);
  });

  it('surfaces an error state when the request fails', async () => {
    server.use(http.get('/api/posts', () => new HttpResponse(null, { status: 500 })));

    const { result } = renderWithClient();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
