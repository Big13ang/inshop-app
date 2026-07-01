import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PendingPostCard from '../PendingPostCard';
import { text } from '../../constants';
import type { PendingPost } from '../../types';

jest.mock('@/components/ui/PostSlider', () => ({
  __esModule: true,
  default: ({ images }: { images: string[] }) => (
    <div data-testid="post-slider">
      {images.map((url) => (
        <img key={url} src={url} alt="" />
      ))}
    </div>
  ),
}));

function post(overrides: Partial<PendingPost> = {}): PendingPost {
  return {
    id: 'post-1',
    caption: 'یک کپشن نمونه',
    mediaUrls: ['https://example.com/a.jpg'],
    submittedAt: '2026-01-01T00:00:00.000Z',
    status: 'pending',
    title: 'دستبند النگویی مدرن',
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
    render(<PendingPostCard post={post({ status: 'rejected', rejectionReason: 'دلیل' })} onOpenMenu={jest.fn()} />);
    expect(screen.getByText(text.statusRejected)).toBeInTheDocument();
    expect(screen.getByText('دلیل')).toBeInTheDocument();
  });

  it('hides the overlay after it is dismissed', async () => {
    const user = userEvent.setup();
    render(<PendingPostCard post={post({ status: 'rejected', rejectionReason: 'دلیل' })} onOpenMenu={jest.fn()} />);

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
    render(<PendingPostCard post={post({ caption: 'متن خاص' })} onOpenMenu={jest.fn()} />);
    expect(screen.getByText('متن خاص')).toBeInTheDocument();
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
