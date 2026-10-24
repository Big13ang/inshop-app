import { fireEvent, render, screen } from '@testing-library/react';
import { usePostContext } from '@/features/posts/components/Post/PostContext';
import { useUser } from '@/features/profile/context/UserContext';
import type { PublicPost } from '@/features/posts/services/publicPostService';
import { PublicPostMenuDrawer } from '../PublicPostMenuDrawer';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/features/posts/components/Post/PostContext', () => ({
  usePostContext: jest.fn(),
}));

jest.mock('@/features/profile/context/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/features/posts/services/deletePostService', () => ({
  useDeletePendingPost: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/features/posts/components/DeletePostConfirmationBottomSheet', () => () => null);

const mockUsePostContext = usePostContext as jest.Mock;
const mockUseUser = useUser as jest.Mock;
const mockCloseMenu = jest.fn();

const post = {
  id: 'post-1',
  description: 'کت پاییزه',
  publishedAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-10-24T12:11:23.591Z',
  owner: { shopName: 'Shop A', username: 'shop_a' },
  media: [],
} as unknown as PublicPost;

describe('PublicPostMenuDrawer edit item', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePostContext.mockReturnValue({
      state: { isMenuOpen: true },
      actions: { closeMenu: mockCloseMenu },
    });
  });

  it('shows the edit link to the post owner', () => {
    mockUseUser.mockReturnValue({ user: { sellerProfile: { username: 'Shop_A' } } });

    render(<PublicPostMenuDrawer post={post} />);

    expect(screen.getByRole('link', { name: 'ویرایش پست' })).toHaveAttribute('href', '/app/post/edit/post-1');
  });

  it('hides the edit link from other sellers', () => {
    mockUseUser.mockReturnValue({ user: { sellerProfile: { username: 'shop_b' } } });

    render(<PublicPostMenuDrawer post={post} />);

    expect(screen.queryByRole('link', { name: 'ویرایش پست' })).not.toBeInTheDocument();
  });

  it('closes the menu when the edit link is tapped', () => {
    mockUseUser.mockReturnValue({ user: { sellerProfile: { username: 'shop_a' } } });

    render(<PublicPostMenuDrawer post={post} />);
    fireEvent.click(screen.getByRole('link', { name: 'ویرایش پست' }));

    expect(mockCloseMenu).toHaveBeenCalled();
  });
});
