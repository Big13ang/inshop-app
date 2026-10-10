import { render, screen, fireEvent } from '@testing-library/react';
import { FeedContent } from '../FeedContent';
import type { BackendFeedPost } from '../../services/feedService';

// Mock child components that might use complex styles or next/image
jest.mock('../GridTile', () => ({
  GridTile: ({ post }: { post: BackendFeedPost }) => (
    <div data-testid={`grid-tile-${post.id}`}>{post.description}</div>
  ),
}));

jest.mock('../FeedSkeleton', () => ({
  FeedSkeleton: () => <div data-testid="feed-skeleton">Skeleton</div>,
}));

jest.mock('../FeedEmptyState', () => ({
  FeedEmptyState: ({ title }: { title: string }) => (
    <div data-testid="feed-empty-state">{title}</div>
  ),
}));

describe('FeedContent crash prevention and error resilience', () => {
  beforeAll(() => {
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as unknown as typeof IntersectionObserver;
  });

  const mockPost: BackendFeedPost = {
    id: 'post-1',
    sellerId: 'seller-1',
    description: 'Post 1 description',
    productName: null,
    productImageUrl: null,
    productLink: null,
    status: 'APPROVED',
    reviewedBy: null,
    reviewedAt: null,
    rejectReason: null,
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  };

  it('renders skeleton when initial load is loading', () => {
    render(
      <FeedContent
        posts={[]}
        isLoading={true}
        isError={false}
        isFetchingNextPage={false}
        fetchNextPage={jest.fn()}
      />
    );
    expect(screen.getByTestId('feed-skeleton')).toBeInTheDocument();
  });

  it('renders full-screen error and retry button when empty and isError is true', () => {
    const handleRetry = jest.fn();
    render(
      <FeedContent
        posts={[]}
        isLoading={false}
        isError={true}
        isFetchingNextPage={false}
        fetchNextPage={jest.fn()}
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'تلاش مجدد' });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('DOES NOT crash or hide existing posts when error occurs during fast scrolling pagination', () => {
    const handleRetry = jest.fn();
    render(
      <FeedContent
        posts={[mockPost]}
        isLoading={false}
        isError={true}
        isFetchingNextPage={false}
        hasNextPage={true}
        fetchNextPage={jest.fn()}
        onRetry={handleRetry}
      />
    );

    // Existing posts must remain visible on screen
    expect(screen.getByTestId('grid-tile-post-1')).toBeInTheDocument();

    // Inline error indicator must be shown at the bottom without destroying the grid
    expect(screen.getByText('خطا در دریافت ادامه مطالب')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'تلاش مجدد' });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when not loading and posts are empty', () => {
    render(
      <FeedContent
        posts={[]}
        isLoading={false}
        isError={false}
        isFetchingNextPage={false}
        fetchNextPage={jest.fn()}
      />
    );

    expect(screen.getByTestId('feed-empty-state')).toBeInTheDocument();
  });
});
