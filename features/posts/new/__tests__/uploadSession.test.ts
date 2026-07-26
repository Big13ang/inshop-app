import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { useUploadSession } from '../services/uploadSession';

jest.mock('@/lib/utils', () => ({
  http: {
    post: jest.fn(),
  },
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  jest.clearAllMocks();
});

describe('useUploadSession', () => {
  it('fetches a new session on mount', async () => {
    (http.post as jest.Mock).mockResolvedValueOnce({
      ok: true,
      value: { uploadSessionId: 'new-session-id', expiresAt: '2026-07-26T00:00:00Z' },
    });

    const { result } = renderHook(() => useUploadSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.uploadSessionId).toBe('new-session-id');
    });

    expect(http.post).toHaveBeenCalledWith('/upload-sessions');
  });

  it('always refetches a new session on mount even if query data exists', async () => {
    queryClient.setQueryData(queryKeys.posts.uploadSession(), {
      uploadSessionId: 'cached-session',
      expiresAt: '2026-07-21T00:00:00Z',
    });

    (http.post as jest.Mock).mockResolvedValueOnce({
      ok: true,
      value: { uploadSessionId: 'fresh-session-id', expiresAt: '2026-07-26T00:00:00Z' },
    });

    const { result } = renderHook(() => useUploadSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.uploadSessionId).toBe('fresh-session-id');
    });

    expect(http.post).toHaveBeenCalledWith('/upload-sessions');
  });
});
