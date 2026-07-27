import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProfileView from '../ProfileView';
import { text } from '../../constants';
import type { UserProfile } from '../../services/profileService';
import type { PendingPost } from '@/features/posts/pending/types';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/app/profile',
}));

jest.mock('@/components/layout/MainFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="main-footer" />,
}));

let mockUser: UserProfile | null = null;

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({ user: mockUser, isLoading: false, error: null, isLoggedIn: !!mockUser }),
}));

jest.mock('../../services/profileService', () => ({
  profileService: {
    useUserProfile: () => ({ data: mockUser, isLoading: false }),
  },
}));

const POST_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELETED: 'DELETED',
} as const;

let mockPosts: PendingPost[] = [];

jest.mock('@/features/posts/services/postsQueryService', () => ({
  POST_STATUS: {
    PENDING_REVIEW: 'PENDING_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    DELETED: 'DELETED',
  },
  postsQueryService: {
    useDeletePendingPost: () => ({ mutate: jest.fn() }),
    useSellerPostsByStatus: (status: string) => ({
      data: mockPosts.filter((post) => post.status === status),
    }),
    useInfiniteSellerPostsByStatus: (status: string) => ({
      data: {
        pages: [
          {
            data: mockPosts.filter((post) => post.status === status),
            pagination: { nextCursor: null, hasNext: false },
          },
        ],
        pageParams: [null],
      },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    }),
  },
}));

function makePost(overrides: Partial<PendingPost> = {}): PendingPost {
  return {
    id: 'post-1',
    sellerId: 'seller-1',
    description: 'انگشتر طلای ۱۸ عیار. بسیار شیک.',
    status: POST_STATUS.APPROVED,
    rejectReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    reviewedBy: null,
    reviewedAt: null,
    media: [],
    sellerName: 'گالری طلای مدرن',
    sellerAvatar: '',
    isVerified: true,
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    name: 'فرشاد',
    email: 'seller@inshop.ir',
    isVerifiedSeller: true,
    sellerActivatedAt: null,
    isAdmin: false,
    avatarUrl: null,
    sellerProfile: {
      id: 'sp-1',
      userId: 'user-1',
      username: 'modern_gold',
      shopName: 'گالری طلای مدرن',
      bio: 'فروش طلا و جواهر',
      address: 'تهران، خیابان پاسداران',
      addressShow: true,
      phones: [{ id: 'p-1', phoneNumber: '09171234567' }],
    },
    profile: {
      id: 1,
      phoneNumber: '09171234567',
      firstName: 'فرشاد',
      lastName: 'تست',
      nationalId: '1234567890',
      status: 'APPROVED',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockUser = makeUser();
  mockPosts = [];
});

describe('ProfileView', () => {
  it('redirects to edit page when user has no seller profile', () => {
    mockUser = makeUser({ sellerProfile: undefined, businessData: undefined });
    render(<ProfileView />);

    expect(mockReplace).toHaveBeenCalledWith('/app/profile/edit');
  });

  it('renders the shop name, handle, bio and address', () => {
    render(<ProfileView />);

    expect(screen.getByText('گالری طلای مدرن')).toBeInTheDocument();
    expect(screen.getByText('@modern_gold')).toBeInTheDocument();
    expect(screen.getByText('فروش طلا و جواهر')).toBeInTheDocument();
    expect(screen.getByText('تهران، خیابان پاسداران')).toBeInTheDocument();
  });

  it('hides the address when the seller turned visibility off', () => {
    const hidden = makeUser();
    hidden.sellerProfile!.addressShow = false;
    mockUser = hidden;

    render(<ProfileView />);

    expect(screen.queryByText('تهران، خیابان پاسداران')).not.toBeInTheDocument();
  });

  it('shows placeholder copy when no bio has been written', () => {
    const noBio = makeUser();
    noBio.sellerProfile!.bio = '';
    mockUser = noBio;

    render(<ProfileView />);

    expect(screen.getByText(text.overview.bioEmpty)).toBeInTheDocument();
  });

  it('counts published posts in the stats row', () => {
    mockPosts = [
      makePost({ id: '1' }),
      makePost({ id: '2' }),
      makePost({ id: '3', status: POST_STATUS.PENDING_REVIEW }),
      makePost({ id: '4', status: POST_STATUS.REJECTED }),
    ];

    render(<ProfileView />);

    const published = screen.getByText(text.overview.statPublished).previousSibling;
    expect(published).toHaveTextContent('2');
  });

  it('shows the pending banner only when posts await review', async () => {
    render(<ProfileView />);
    expect(screen.queryByText(text.overview.pendingBannerTitle)).not.toBeInTheDocument();

    mockPosts = [makePost({ status: POST_STATUS.PENDING_REVIEW })];
    render(<ProfileView />);

    const banner = screen.getByText(text.overview.pendingBannerTitle);
    expect(banner).toBeInTheDocument();

    await userEvent.click(banner);
    expect(mockPush).toHaveBeenCalledWith('/app/posts/pending');
  });

  it('navigates to the edit page from the edit action', async () => {
    render(<ProfileView />);

    await userEvent.click(screen.getByRole('button', { name: text.overview.editActionTitle }));

    expect(mockPush).toHaveBeenCalledWith('/app/profile/edit');
  });

  it('offers to create a post when the grid is empty', async () => {
    render(<ProfileView />);

    expect(screen.getByText(text.overview.gridEmptyTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.overview.gridEmptyAction }));

    expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
  });

  it('renders one grid cell per approved post', () => {
    mockPosts = [makePost({ id: 'a' }), makePost({ id: 'b' }), makePost({ id: 'c' })];

    const { container } = render(<ProfileView />);

    expect(container.querySelectorAll('[id^="profile-grid-item-"]')).toHaveLength(3);
  });
});
