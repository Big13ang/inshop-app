import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PendingPostsView from '../PendingPostsView';
import { text } from '../constants';
import type { PendingPost } from '../types';

jest.mock('gsap', () => ({
  killTweensOf: jest.fn(),
  fromTo: jest.fn((targets, from, to) => {
    if (to && typeof to.onComplete === 'function') {
      to.onComplete();
    }
  }),
  to: jest.fn((targets, vars) => {
    if (vars && typeof vars.onComplete === 'function') {
      vars.onComplete();
    }
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/app/posts/pending',
}));


jest.mock('@/components/layout/MainFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="main-footer" />,
}));

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

const mockMutate = jest.fn();
let mockData: PendingPost[] = [];

jest.mock('../hooks/usePendingPosts', () => ({
  usePendingPosts: () => ({ data: mockData, isLoading: false }),
}));

jest.mock('../hooks/useDeletePendingPost', () => ({
  useDeletePendingPost: () => ({ mutate: mockMutate, isPending: false }),
}));

function post(overrides: Partial<PendingPost> = {}): PendingPost {
  return {
    id: 'post-1',
    caption: 'کپشن',
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

afterEach(() => {
  jest.clearAllMocks();
  mockData = [];
});

describe('PendingPostsView', () => {
  it('shows the empty state when there are no posts', () => {
    mockData = [];
    render(<PendingPostsView onBack={jest.fn()} onAddPost={jest.fn()} />);

    expect(screen.getByText(text.emptyTitle)).toBeInTheDocument();
  });

  it('renders a card for every post', () => {
    mockData = [post({ id: 'a' }), post({ id: 'b' })];
    render(<PendingPostsView onBack={jest.fn()} onAddPost={jest.fn()} />);

    expect(screen.getAllByTestId('post-slider')).toHaveLength(2);
  });

  it('shows the post count in the header', () => {
    mockData = [post({ id: 'a' }), post({ id: 'b' })];
    render(<PendingPostsView onBack={jest.fn()} onAddPost={jest.fn()} />);

    expect(screen.getByText(`${text.headerTitle} (2)`)).toBeInTheDocument();
  });

  it('deletes the post when the menu delete action is confirmed', async () => {
    const user = userEvent.setup();
    mockData = [post({ id: 'a' })];
    render(<PendingPostsView onBack={jest.fn()} onAddPost={jest.fn()} />);

    await user.click(screen.getByLabelText('بیشتر'));
    await user.click(await screen.findByText(text.deleteLabel));

    expect(mockMutate).toHaveBeenCalledWith('a');
  });
});
