import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { useUser } from '@/features/profile/context/UserContext';
import { expireSellerProfileCache } from '@/features/profile/actions/expireSellerProfileCache';
import { useDeletePendingPost } from '../deletePostService';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return { ...actual, http: { delete: jest.fn() } };
});
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/features/profile/context/UserContext', () => ({ useUser: jest.fn() }));
// A Server Action cannot run in jsdom, so it is replaced at the module boundary.
jest.mock('@/features/profile/actions/expireSellerProfileCache', () => ({ expireSellerProfileCache: jest.fn() }));

const mockDelete = http.delete as jest.Mock;
const mockExpire = expireSellerProfileCache as jest.Mock;
const FEED_KEY = ['posts', 'feed'];

function seedFeed(queryClient: QueryClient) {
  queryClient.setQueryData(FEED_KEY, { pages: [{ data: [{ id: 'post-1' }, { id: 'post-2' }] }], pageParams: [null] });
}

function feedPostIds(queryClient: QueryClient): string[] {
  const feed = queryClient.getQueryData<{ pages: { data: { id: string }[] }[] }>(FEED_KEY);
  return feed?.pages.flatMap((page) => page.data.map((post) => post.id)) ?? [];
}

function renderDeleteHook() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  seedFeed(queryClient);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(useDeletePendingPost, { wrapper }) };
}

describe('useDeletePendingPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: { sellerProfile: { username: 'shop_a' } } });
    mockExpire.mockResolvedValue(undefined);
  });

  it('removes the deleted post from the cached feed', async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    const { queryClient, result } = renderDeleteHook();

    act(() => {
      result.current.mutate('post-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(feedPostIds(queryClient)).toEqual(['post-2']);
  });

  it('puts the post back in the cached feed when the delete fails', async () => {
    mockDelete.mockRejectedValueOnce(new Error('network down'));
    const { queryClient, result } = renderDeleteHook();

    act(() => {
      result.current.mutate('post-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(feedPostIds(queryClient)).toEqual(['post-1', 'post-2']);
  });

  it('still reports the delete as successful when expiring the profile cache fails', async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    mockExpire.mockRejectedValueOnce(new Error('action unavailable'));
    const { result } = renderDeleteHook();

    act(() => {
      result.current.mutate('post-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });
});
