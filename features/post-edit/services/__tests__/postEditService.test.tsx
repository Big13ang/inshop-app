import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import type { PostEdit, PostEditUpdateResult } from '@/features/post-edit/types';
import { getPostForEdit, replacePostCategories, updatePostDescription, usePostForEdit, useUpdatePostDescription } from '../postEditService';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return { ...actual, http: { get: jest.fn(), patch: jest.fn(), put: jest.fn() } };
});

const mockGet = http.get as jest.Mock;
const mockPatch = http.patch as jest.Mock;
const mockPut = http.put as jest.Mock;

const mockPost: PostEdit = {
  id: 'post-1',
  sellerId: 'seller-1',
  description: 'کت پاییزه',
  productName: null,
  productImageUrl: null,
  productLink: null,
  status: 'APPROVED',
  isFeedEnabled: true,
  reviewedBy: 'admin-1',
  reviewedAt: '2026-08-25T11:00:00.000Z',
  rejectReason: null,
  createdAt: '2026-08-25T10:15:30.000Z',
  updatedAt: '2026-08-25T11:00:00.000Z',
  owner: null,
  categories: [{ id: 'cat-1', name: 'موبایل' }],
  media: [],
};

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
  updatedAt: '2026-08-25T12:00:00.000Z',
};

// The backend wraps every response in { success, data }.
const mockEnvelope = { success: true, data: mockPost };

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function renderPostEditHook(postId: string) {
  const { wrapper } = createWrapper();
  return renderHook(() => usePostForEdit(postId), { wrapper });
}

describe('getPostForEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests the seller post for the given id and returns the post, not the envelope', async () => {
    mockGet.mockResolvedValueOnce(mockEnvelope);

    const post = await getPostForEdit('post-1');

    expect(mockGet).toHaveBeenCalledWith('/seller/posts/post-1');
    expect(post).toEqual(mockPost);
  });

  it('keeps the categories the backend returns with the post', async () => {
    mockGet.mockResolvedValueOnce(mockEnvelope);

    const post = await getPostForEdit('post-1');

    expect(post.categories).toEqual([{ id: 'cat-1', name: 'موبایل' }]);
  });
});

describe('updatePostDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the description with PATCH and returns the updated post', async () => {
    mockPatch.mockResolvedValueOnce({ success: true, data: mockUpdated });

    const updated = await updatePostDescription('post-1', 'متن جدید');

    expect(mockPatch).toHaveBeenCalledWith('/seller/posts/post-1', { description: 'متن جدید' });
    expect(updated).toEqual(mockUpdated);
  });
});

describe('usePostForEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the post loaded for the given id', async () => {
    mockGet.mockResolvedValueOnce(mockEnvelope);

    const { result } = renderPostEditHook('post-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPost);
  });

  it('exposes an error when the post cannot be loaded', async () => {
    mockGet.mockRejectedValueOnce(new Error('POST.NOT_FOUND'));

    const { result } = renderPostEditHook('missing');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdatePostDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resets every post query and invalidates the user profile after a successful save', async () => {
    mockPatch.mockResolvedValueOnce({ success: true, data: mockUpdated });
    const { queryClient, wrapper } = createWrapper();
    const reset = jest.spyOn(queryClient, 'resetQueries');
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdatePostDescription('post-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('متن جدید');
    });

    expect(reset).toHaveBeenCalledWith({ queryKey: ['posts'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user', 'profile'] });
  });

  it('does not invalidate anything when the save fails', async () => {
    mockPatch.mockRejectedValueOnce(new Error('POST.NOT_FOUND'));
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdatePostDescription('post-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('متن جدید').catch(() => undefined);
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('replacePostCategories', () => {
  it('PUTs the category ids and returns the unwrapped result', async () => {
    const result = { post: mockUpdated, categories: [{ id: 'cat-2', name: 'لپ تاپ' }], changed: true };
    mockPut.mockResolvedValueOnce({ success: true, data: result });

    await expect(replacePostCategories('post-1', ['cat-2'])).resolves.toEqual(result);
    expect(mockPut).toHaveBeenCalledWith('/seller/posts/post-1/categories', { categoryIds: ['cat-2'] });
  });
});
