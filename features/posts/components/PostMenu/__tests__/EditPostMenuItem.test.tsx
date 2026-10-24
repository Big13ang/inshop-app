import { render, screen } from '@testing-library/react';
import { useUser } from '@/features/profile/context/UserContext';
import { EditPostMenuItem } from '../EditPostMenuItem';

jest.mock('@/features/profile/context/UserContext', () => ({
  useUser: jest.fn(),
}));

const mockUseUser = useUser as jest.Mock;

describe('EditPostMenuItem', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue({ user: { sellerProfile: { username: 'Shop_A' } } });
  });

  it('links to the edit page of the post for the owner', () => {
    render(<EditPostMenuItem postId="post-1" authorUsername="shop_a" />);

    expect(screen.getByRole('link', { name: 'ویرایش پست' })).toHaveAttribute('href', '/app/post/edit/post-1');
  });

  it('is hidden from a signed-in user who does not own the post', () => {
    render(<EditPostMenuItem postId="post-1" authorUsername="shop_b" />);

    expect(screen.queryByRole('link', { name: 'ویرایش پست' })).not.toBeInTheDocument();
  });

  it('is hidden when the post has no owner username', () => {
    render(<EditPostMenuItem postId="post-1" authorUsername="" />);

    expect(screen.queryByRole('link', { name: 'ویرایش پست' })).not.toBeInTheDocument();
  });

  it('is shown on the seller\'s own list without an author', () => {
    render(<EditPostMenuItem postId="post-1" />);

    expect(screen.getByRole('link', { name: 'ویرایش پست' })).toHaveAttribute('href', '/app/post/edit/post-1');
  });
});
