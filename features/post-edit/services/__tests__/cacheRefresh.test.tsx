import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
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

// These run real observers: a save should refetch the queries that are on screen.
describe('saving a post refreshes the views that show it', () => {
  it('refetches the mounted feed and user profile queries', async () => {
    mockPatch.mockResolvedValueOnce({ success: true, data: mockUpdated });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const feedFetch = jest.fn(() => Promise.resolve({ data: [] }));
    const profileFetch = jest.fn(() => Promise.resolve({ data: [] }));
    renderHook(() => useQuery({ queryKey: ['posts', 'feed'], queryFn: feedFetch }), { wrapper });
    renderHook(() => useQuery({ queryKey: ['user', 'profile'], queryFn: profileFetch }), { wrapper });
    await waitFor(() => expect(feedFetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(profileFetch).toHaveBeenCalledTimes(1));

    const { result } = renderHook(() => useUpdatePostDescription('post-1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('متن جدید');
    });

    await waitFor(() => expect(feedFetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(profileFetch).toHaveBeenCalledTimes(2));
  });

  it('does not refetch when the save fails', async () => {
    mockPatch.mockRejectedValueOnce(new Error('POST.NOT_FOUND'));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const feedFetch = jest.fn(() => Promise.resolve({ data: [] }));
    renderHook(() => useQuery({ queryKey: ['posts', 'feed'], queryFn: feedFetch }), { wrapper });
    await waitFor(() => expect(feedFetch).toHaveBeenCalledTimes(1));

    const { result } = renderHook(() => useUpdatePostDescription('post-1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('متن جدید').catch(() => undefined);
    });

    expect(feedFetch).toHaveBeenCalledTimes(1);
  });
});
