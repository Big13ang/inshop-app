import { fireEvent, render, screen } from '@testing-library/react';
import { useInfinitePendingRejectedPosts } from '../services/pendingPostsService';
import { useUser } from '@/features/profile/context/UserContext';
import { PendingPostsView } from '../PendingPostsView';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('../services/pendingPostsService', () => ({
  useInfinitePendingRejectedPosts: jest.fn(),
}));

jest.mock('../../services/deletePostService', () => ({
  useDeletePendingPost: () => ({ mutate: jest.fn(), isPending: false }),
}));

// The real card needs the full post data. The menu only needs its open button.
jest.mock('../components/PendingPostCard', () => ({
  PendingPostCard: ({ post, onOpenMenu }: { post: { id: string }; onOpenMenu: (id: string) => void }) => (
    <button type="button" onClick={() => onOpenMenu(post.id)}>
      open menu {post.id}
    </button>
  ),
}));

jest.mock('@/components/layout/MainFooter', () => () => null);

jest.mock('@/features/profile/context/UserContext', () => ({
  useUser: jest.fn(),
}));

const mockUsePending = useInfinitePendingRejectedPosts as jest.Mock;
const mockUseUser = useUser as jest.Mock;

describe('PendingPostsView post menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({ user: { sellerProfile: { username: 'shop_a' } } });
    mockUsePending.mockReturnValue({
      posts: [{ id: 'post-1' }],
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });
  });

  it('shows the edit item with a link to the edit page, above delete', () => {
    render(<PendingPostsView onAddPost={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'open menu post-1' }));

    expect(screen.getByRole('link', { name: 'ویرایش پست' })).toHaveAttribute('href', '/app/post/edit/post-1');
    expect(screen.getByRole('button', { name: /حذف/ })).toBeInTheDocument();
  });
});
