import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useInView } from 'react-intersection-observer';
import { postAnalytics } from '@/features/posts/analytics/postAnalytics';
import type { BackendFeedPost } from '@/features/feed/services/feedService';
import { ProfileGridItem } from '../ProfileGridItem';

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(() => ({ ref: jest.fn(), inView: false })),
}));

function preventNavigation(event: React.MouseEvent) {
  event.preventDefault();
}

const post: BackendFeedPost = {
  id: 'post-1',
  sellerId: 'seller-1',
  description: 'کفش چرم\nسایز ۴۲',
  productName: null,
  productImageUrl: null,
  productLink: null,
  status: 'approved',
  reviewedBy: null,
  reviewedAt: null,
  rejectReason: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  owner: { shopName: 'کفش‌سرا', username: 'kafsh', profileUrl: null },
  media: [],
};

const expectedItem = { postId: 'post-1', shopUsername: 'kafsh', shopName: 'کفش‌سرا' };

describe('ProfileGridItem analytics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports select_item through the facade when the card is clicked', async () => {
    const selectItem = jest.spyOn(postAnalytics, 'selectItem').mockImplementation(() => {});

    render(
      <div onClick={preventNavigation}>
        <ProfileGridItem post={post} listName="home_feed" index={3} />
      </div>
    );
    await userEvent.click(screen.getByRole('link'));

    expect(selectItem).toHaveBeenCalledWith('home_feed', expectedItem, 3);
  });

  it('reports an impression once the card becomes visible', () => {
    const itemImpression = jest.spyOn(postAnalytics, 'itemImpression').mockImplementation(() => {});
    jest.mocked(useInView).mockImplementationOnce((options) => {
      options?.onChange?.(true, {} as IntersectionObserverEntry);
      return { ref: jest.fn(), inView: true } as unknown as ReturnType<typeof useInView>;
    });

    render(<ProfileGridItem post={post} listName="search_results" index={0} />);

    expect(itemImpression).toHaveBeenCalledWith('search_results', expectedItem, 0);
  });
});
