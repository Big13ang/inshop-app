import { fireEvent, render, screen } from '@testing-library/react';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import { usePostForEdit } from '@/features/post-edit/services/postEditService';
import type { PostEdit } from '@/features/post-edit/types';
import { PostEditClientWrapper } from '../PostEditClientWrapper';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('@/features/post-edit/services/postEditService', () => ({
  usePostForEdit: jest.fn(),
  useUpdatePostDescription: () => ({ mutate: jest.fn(), isPending: false }),
}));

const mockUsePostForEdit = usePostForEdit as jest.Mock;

const loadedPost: PostEdit = {
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
  media: [],
};

describe('PostEditClientWrapper', () => {
  afterEach(() => {
    useMediaStore.getState().reset();
  });

  it('shows the new-post details view with the saved caption', () => {
    mockUsePostForEdit.mockReturnValue({ data: loadedPost, isPending: false, isError: false });

    render(<PostEditClientWrapper postId="post-1" />);

    expect(screen.getByRole('textbox')).toHaveValue('کت پاییزه');
    expect(screen.getByRole('button', { name: 'ذخیره' })).toBeInTheDocument();
  });

  it('loads the post into the new-post store in edit mode', () => {
    mockUsePostForEdit.mockReturnValue({ data: loadedPost, isPending: false, isError: false });

    render(<PostEditClientWrapper postId="post-1" />);

    const state = useMediaStore.getState();
    expect(state.isEditing).toBe(true);
    expect(state.caption).toBe('کت پاییزه');
    expect(state.phase).toBe('details');
  });

  it('clears the store when the page unmounts', () => {
    mockUsePostForEdit.mockReturnValue({ data: loadedPost, isPending: false, isError: false });

    const { unmount } = render(<PostEditClientWrapper postId="post-1" />);
    unmount();

    expect(useMediaStore.getState().isEditing).toBe(false);
    expect(useMediaStore.getState().caption).toBe('');
  });

  it('shows the offline view with a retry when the request never reached the server', () => {
    const refetch = jest.fn();
    mockUsePostForEdit.mockReturnValue({
      data: undefined,
      error: new TypeError('Failed to fetch'),
      isPending: false,
      isError: true,
      refetch,
    });

    render(<PostEditClientWrapper postId="post-1" />);

    expect(screen.getByText('ارتباط با اینترنت برقرار نیست')).toBeInTheDocument();
    expect(screen.queryByText('پست مورد نظر وجود ندارد')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'تلاش مجدد' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the not-found view when the server answers with an error', () => {
    mockUsePostForEdit.mockReturnValue({
      data: undefined,
      error: new Error('POST.NOT_FOUND'),
      isPending: false,
      isError: true,
      refetch: jest.fn(),
    });

    render(<PostEditClientWrapper postId="post-1" />);

    expect(screen.getByText('پست مورد نظر وجود ندارد')).toBeInTheDocument();
    expect(screen.queryByText('ارتباط با اینترنت برقرار نیست')).not.toBeInTheDocument();
  });

  it('shows the not-found view when the post cannot be loaded', () => {
    mockUsePostForEdit.mockReturnValue({ data: undefined, isPending: false, isError: true });

    render(<PostEditClientWrapper postId="missing" />);

    expect(screen.getByText('پست مورد نظر وجود ندارد')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
