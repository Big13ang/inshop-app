import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { useMediaStore } from '../services/mediaStore';
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

  useMediaStore.getState().reset();
  jest.clearAllMocks();
});

afterEach(() => {
  useMediaStore.getState().reset();
});

describe('useUploadSession', () => {
  it('hydrates the media store from cached query data', async () => {
    queryClient.setQueryData(queryKeys.posts.uploadSession(), {
      uploadSessionId: 'cached-session',
      expiresAt: '2026-07-21T00:00:00Z',
    });

    renderHook(() => useUploadSession(), { wrapper });

    await waitFor(() => {
      expect(useMediaStore.getState().uploadSessionId).toBe('cached-session');
    });

    expect(http.post).not.toHaveBeenCalled();
  });
});
