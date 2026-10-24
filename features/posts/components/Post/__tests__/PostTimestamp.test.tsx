import { render, screen } from '@testing-library/react';
import { Post } from '@/features/posts/components/Post';
import type { BasePostData } from '@/features/posts/components/Post/types';

const basePost: BasePostData = {
  id: 'post-1',
  description: 'کت پاییزه',
  updatedAt: '2026-10-24T12:11:23.591Z',
  sellerName: 'Shop',
  sellerAvatar: '',
  isVerified: false,
};

describe('Post.Timestamp', () => {
  it('shows the last update date, not the creation date', () => {
    render(
      <Post.Provider post={basePost}>
        <Post.Timestamp />
      </Post.Provider>,
    );

    const expected = new Date(basePost.updatedAt).toLocaleDateString('fa-IR');
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
