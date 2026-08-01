import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainFooterNav from '../MainFooterNav';

const mockPush = jest.fn();
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

const mockSignOutMutate = jest.fn();
jest.mock('@/features/auth/hooks/useAuthMutations', () => ({
  useSignOutMutation: () => ({
    mutate: (payload: unknown, options?: { onSuccess?: () => void }) => {
      mockSignOutMutate(payload);
      options?.onSuccess?.();
    },
    isPending: false,
  }),
}));

jest.mock('@/features/profile/services/profileService', () => ({
  profileService: {
    useMe: jest.fn().mockReturnValue({ data: null }),
  },
}));

describe('MainFooterNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
  });

  it('renders all navigation tabs', () => {
    render(<MainFooterNav />);

    expect(screen.getByLabelText('خانه')).toBeInTheDocument();
    expect(screen.getByLabelText('جستجو')).toBeInTheDocument();
    expect(screen.getByLabelText('پست جدید')).toBeInTheDocument();
    expect(screen.getByLabelText('پروفایل')).toBeInTheDocument();
    expect(screen.getByLabelText('خروج')).toBeInTheDocument();
  });

  it('navigates to target tab on click', async () => {
    const user = userEvent.setup();
    render(<MainFooterNav />);

    const searchTab = screen.getByLabelText('جستجو');
    await user.click(searchTab);

    expect(mockPush).toHaveBeenCalledWith('/app/search');
  });

  it('navigates to create post page when clicking new post tab', async () => {
    const user = userEvent.setup();
    render(<MainFooterNav />);

    const newPostTab = screen.getByLabelText('پست جدید');
    await user.click(newPostTab);

    expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
  });

  it('calls signOut and redirects to login when clicking logout tab and confirming', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';

    render(<MainFooterNav />);

    const logoutTab = screen.getByLabelText('خروج');
    await user.click(logoutTab);

    const confirmBtn = screen.getByRole('button', { name: /تایید خروج/i });
    await user.click(confirmBtn);

    expect(mockSignOutMutate).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('does not navigate if clicking the already active tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/profile';
    render(<MainFooterNav />);

    const profileTab = screen.getByLabelText('پروفایل');
    await user.click(profileTab);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
