import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { useInfiniteFeedPosts } from '../feedService';

jest.mock('@/lib/utils', () => {
  const original = jest.requireActual('@/lib/utils');
  return {
    ...original,
    http: {
      get: jest.fn(),
    },
  };
});

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

const mockGet = http.get as jest.Mock;

function feedPage(ids: string[], nextCursor: string | null) {
  return {
    success: true,
    data: ids.map((id) => ({ id })),
    pagination: { nextCursor, hasNext: nextCursor !== null },
  };
}

function lastRequestParams(): URLSearchParams {
  const calls = mockGet.mock.calls;
  return calls[calls.length - 1][1].searchParams as URLSearchParams;
}

function renderFeed() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return renderHook(() => useInfiniteFeedPosts(), { wrapper: Wrapper });
}

type FeedHook = ReturnType<typeof renderFeed>;

function postIds(hook: FeedHook): string[] {
  return hook.result.current.posts.map((post) => post.id);
}

async function renderFeedWithTwoPages() {
  mockGet
    .mockResolvedValueOnce(feedPage(['post-1', 'post-2'], 'cursor-2'))
    .mockResolvedValueOnce(feedPage(['post-3'], 'cursor-3'));

  const hook = renderFeed();
  await waitFor(() => expect(hook.result.current.posts).toHaveLength(2));

  await act(() => hook.result.current.fetchNextPage());
  await waitFor(() => expect(hook.result.current.posts).toHaveLength(3));

  return hook;
}

describe('useInfiniteFeedPosts refreshFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests the feed again with the same limit and no cursor', async () => {
    const hook = await renderFeedWithTwoPages();
    mockGet.mockResolvedValueOnce(feedPage(['post-new'], 'cursor-new'));

    await act(() => hook.result.current.refreshFeed());

    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(mockGet.mock.calls[2][0]).toBe('/posts/feed');
    expect(lastRequestParams().get('limit')).toBe('15');
    expect(lastRequestParams().has('cursor')).toBe(false);
  });

  it('replaces all loaded pages with the fresh first page', async () => {
    const hook = await renderFeedWithTwoPages();
    mockGet.mockResolvedValueOnce(feedPage(['post-new'], 'cursor-new'));

    await act(() => hook.result.current.refreshFeed());

    await waitFor(() => expect(postIds(hook)).toEqual(['post-new']));
    expect(hook.result.current.hasNextPage).toBe(true);
  });

  it('continues paging from the fresh cursor after a refresh', async () => {
    const hook = await renderFeedWithTwoPages();
    mockGet
      .mockResolvedValueOnce(feedPage(['post-new'], 'cursor-new'))
      .mockResolvedValueOnce(feedPage(['post-next'], null));

    await act(() => hook.result.current.refreshFeed());
    await waitFor(() => expect(postIds(hook)).toEqual(['post-new']));
    await act(() => hook.result.current.fetchNextPage());

    expect(lastRequestParams().get('cursor')).toBe('cursor-new');
    await waitFor(() => expect(postIds(hook)).toEqual(['post-new', 'post-next']));
  });

  it('keeps the current posts and shows a toast when the refresh fails', async () => {
    const hook = await renderFeedWithTwoPages();
    mockGet.mockRejectedValueOnce(new Error('network down'));

    await act(() => hook.result.current.refreshFeed());

    expect(postIds(hook)).toEqual(['post-1', 'post-2', 'post-3']);
    expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.feed.refreshFailed);
  });
});
