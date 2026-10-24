import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import type { PostEditUpdateResult } from '@/features/post-edit/types';
import { useUpdatePostDescription } from '../postEditService';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return { ...actual, http: { get: jest.fn(), patch: jest.fn() } };
});

const mockPatch = http.patch as jest.Mock;

const mockUpdated: PostEditUpdateResult = {
  id: 'post-1',
  sellerId: 'seller-1',
  description: 'متن جدید',
  productName: null,
  productImageUrl: null,
  productLink: null,
  status: 'PENDING_REVIEW',
  isFeedEnabled: false,
  reviewedBy: null,
  reviewedAt: null,
  rejectReason: null,
  createdAt: '2026-08-25T10:15:30.000Z',
  updatedAt: '2026-10-24T12:11:23.591Z',
};

// The feed pages through a server snapshot. After a save it must start from the first page
// again, so the pending post is dropped. Replaying the old cursor would return the old list.
describe('saving a post resets the feed snapshot', () => {
  it('restarts the feed from the first page instead of replaying the old cursor', async () => {
    mockPatch.mockResolvedValueOnce({ success: true, data: mockUpdated });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const requestedCursors: Array<string | null> = [];
    renderHook(
      () =>
        useInfiniteQuery({
          queryKey: ['posts', 'feed', 'infinite', 15],
          queryFn: ({ pageParam }) => {
            requestedCursors.push(pageParam as string | null);
            return Promise.resolve({ data: [], pagination: { nextCursor: 'cursor-2', hasNext: true } });
          },
          initialPageParam: null as string | null,
          getNextPageParam: (lastPage: { pagination: { nextCursor: string; hasNext: boolean } }) =>
            lastPage.pagination.hasNext ? lastPage.pagination.nextCursor : undefined,
        }),
      { wrapper },
    );
    await waitFor(() => expect(requestedCursors).toEqual([null]));

    const { result } = renderHook(() => useUpdatePostDescription('post-1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('متن جدید');
    });

    await waitFor(() => expect(requestedCursors.at(-1)).toBeNull());
    expect(requestedCursors).not.toContain('cursor-2');
  });
});
