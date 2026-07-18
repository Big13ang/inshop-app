import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PendingPostCard from '../PendingPostCard';
import { text } from '../../constants';
import type { PendingPost } from '../../types';
import { POST_STATUS } from '../../../services/postsQueryService';

jest.mock('@/components/ui/PostSlider', () => ({
  __esModule: true,
  default: ({ images }: { images: string[] }) => (
    <div data-testid="post-slider">
      {images.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt="" />
      ))}
    </div>
  ),
}));

function post(overrides: Partial<PendingPost> = {}): PendingPost {
  return {
    id: 'post-1',
    sellerId: 'seller-1',
    description: 'یک کپشن نمونه',
    media: [
      {
        id: 'media-1',
        uploadSessionId: 'session-1',
        sellerId: 'seller-1',
        postId: 'post-1',
        status: 'ready',
        storageKey: 'photo-1.jpg',
        originalFileName: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        order: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        url: 'https://example.com/a.jpg'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    status: POST_STATUS.PENDING_REVIEW,
    rejectReason: null,
    reviewedBy: null,
    reviewedAt: null,
    sellerName: 'گالری طلای مدرن',
    sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    isVerified: true,
    ...overrides,
  };
}

describe('PendingPostCard', () => {
  it('shows the pending badge for a pending post', () => {
    render(<PendingPostCard post={post()} onOpenMenu={jest.fn()} />);
    expect(screen.getByText(text.statusPending)).toBeInTheDocument();
  });

  it('shows the rejected badge and overlay for a rejected post', () => {
    render(<PendingPostCard post={post({ status: POST_STATUS.REJECTED, rejectReason: 'دلیل' })} onOpenMenu={jest.fn()} />);
    expect(screen.getByText(text.statusRejected)).toBeInTheDocument();
    expect(screen.getByText('دلیل')).toBeInTheDocument();
  });

  it('hides the overlay after it is dismissed', async () => {
    const user = userEvent.setup();
    render(<PendingPostCard post={post({ status: POST_STATUS.REJECTED, rejectReason: 'دلیل' })} onOpenMenu={jest.fn()} />);

    await user.click(screen.getByText(text.rejectionActionText));

    expect(screen.queryByText('دلیل')).not.toBeInTheDocument();
  });

  it('calls onOpenMenu with the post id when the menu button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenMenu = jest.fn();
    render(<PendingPostCard post={post({ id: 'xyz' })} onOpenMenu={onOpenMenu} />);

    await user.click(screen.getByLabelText('بیشتر'));

    expect(onOpenMenu).toHaveBeenCalledWith('xyz');
  });

  it('renders the caption', () => {
    render(<PendingPostCard post={post({ description: 'متن خاص' })} onOpenMenu={jest.fn()} />);
    expect(screen.getByText('متن خاص')).toBeInTheDocument();
  });

  it('truncates long captions and expands them from the more button', async () => {
    const user = userEvent.setup();
    const description =
      'این متن طولانی برای تست کوتاه شدن توضیحات پست استفاده می‌شود و باید ابتدا فقط بخشی از آن نمایش داده شود. ادامه متن بعد از کلیک روی دکمه بیشتر قابل مشاهده می‌شود.';

    render(<PendingPostCard post={post({ description })} onOpenMenu={jest.fn()} />);

    expect(screen.queryByText(description)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'بیشتر...' }));

    expect(screen.getByText(description)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'بیشتر...' })).not.toBeInTheDocument();
  });

  it('renders the seller details (avatar, name)', () => {
    render(
      <PendingPostCard
        post={post({
          sellerName: 'فروشگاه نمونه',
          sellerAvatar: 'https://example.com/avatar.jpg',
        })}
        onOpenMenu={jest.fn()}
      />
    );

    expect(screen.getAllByText('فروشگاه نمونه')).toHaveLength(2);
    const img = screen.getByRole('img', { name: 'فروشگاه نمونه' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders a profile fallback icon when seller avatar is empty', () => {
    render(
      <PendingPostCard
        post={post({
          sellerName: 'فروشگاه نمونه',
          sellerAvatar: '',
        })}
        onOpenMenu={jest.fn()}
      />
    );

    expect(screen.getAllByText('فروشگاه نمونه')).toHaveLength(2);
    const fallback = screen.getByRole('img', { name: 'فروشگاه نمونه' });
    expect(fallback).toBeInTheDocument();
    expect(fallback.tagName.toLowerCase()).toBe('div');
    expect(fallback.querySelector('svg')).toBeInTheDocument();
  });


  it('renders verification badge only when the seller is verified', () => {
    const { rerender } = render(<PendingPostCard post={post({ isVerified: true })} onOpenMenu={jest.fn()} />);
    expect(screen.getByLabelText('تایید شده')).toBeInTheDocument();

    rerender(<PendingPostCard post={post({ isVerified: false })} onOpenMenu={jest.fn()} />);
    expect(screen.queryByLabelText('تایید شده')).not.toBeInTheDocument();
  });
});
