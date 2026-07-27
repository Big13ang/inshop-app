import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { useUploadSession } from '../services/uploadSession';
import { useMediaStore } from '../services/mediaStore';

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
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

  useMediaStore.getState().reset();
  jest.clearAllMocks();
});

describe('useUploadSession', () => {
  it('fetches a new session on mount when store is empty', async () => {
    (http.post as jest.Mock).mockResolvedValueOnce({
      ok: true,
      value: { uploadSessionId: 'new-session-id', expiresAt: '2026-07-26T00:00:00Z' },
    });

    const { result } = renderHook(() => useUploadSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.uploadSessionId).toBe('new-session-id');
    });

    expect(http.post).toHaveBeenCalledWith('/upload-sessions');
    expect(useMediaStore.getState().uploadSessionId).toBe('new-session-id');
  });

  it('reuses the existing session ID from useMediaStore without refetching', async () => {
    useMediaStore.getState().setUploadSessionId('existing-session-id');

    const { result } = renderHook(() => useUploadSession(), { wrapper });

    expect(result.current.data?.uploadSessionId).toBe('existing-session-id');
    expect(http.post).not.toHaveBeenCalled();
  });

  it('fetches a new session after reset when user opens page again', async () => {
    (http.post as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        value: { uploadSessionId: 'session-1', expiresAt: '2026-07-26T00:00:00Z' },
      })
      .mockResolvedValueOnce({
        ok: true,
        value: { uploadSessionId: 'session-2', expiresAt: '2026-07-26T00:00:00Z' },
      });

    // Visit 1
    const { result, unmount } = renderHook(() => useUploadSession(), { wrapper });
    await waitFor(() => {
      expect(result.current.data?.uploadSessionId).toBe('session-1');
    });
    expect(http.post).toHaveBeenCalledTimes(1);

    // Leave page & reset store
    unmount();
    useMediaStore.getState().reset();

    // Visit 2
    const { result: result2 } = renderHook(() => useUploadSession(), { wrapper });
    await waitFor(() => {
      expect(result2.current.data?.uploadSessionId).toBe('session-2');
    });
    expect(http.post).toHaveBeenCalledTimes(2);
  });
});
