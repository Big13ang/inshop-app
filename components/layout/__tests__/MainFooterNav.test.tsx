import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainFooterNav from '../MainFooterNav';
import { toast } from 'sonner';

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

const mockSignOut = jest.fn();
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: () => mockSignOut(),
  },
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

    expect(screen.getByLabelText('پروفایل')).toBeInTheDocument();
    expect(screen.getByLabelText('پیام‌ها - بزودی')).toBeInTheDocument();
    expect(screen.getByLabelText('پست جدید')).toBeInTheDocument();
    expect(screen.getByLabelText('خروج')).toBeInTheDocument();
  });

  it('shows info toast when clicking message tab', async () => {
    const user = userEvent.setup();
    render(<MainFooterNav />);

    const messageTab = screen.getByLabelText('پیام‌ها - بزودی');
    await user.click(messageTab);

    expect(toast.info).toHaveBeenCalledWith('بخش پیام‌ها به‌زودی اضافه خواهد شد');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to profile when clicking profile tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    render(<MainFooterNav />);

    const profileTab = screen.getByLabelText('پروفایل');
    await user.click(profileTab);

    expect(mockPush).toHaveBeenCalledWith('/app/profile');
  });

  it('navigates to new post when clicking new post tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/profile';
    render(<MainFooterNav />);

    const newPostTab = screen.getByLabelText('پست جدید');
    await user.click(newPostTab);

    expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
  });

  it('calls signOut and redirects to login when clicking logout tab and confirming', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    mockSignOut.mockResolvedValue({ error: null });

    render(<MainFooterNav />);

    const logoutTab = screen.getByLabelText('خروج');
    await user.click(logoutTab);

    const confirmBtn = screen.getByRole('button', { name: /تایید خروج/i });
    await user.click(confirmBtn);

    expect(mockSignOut).toHaveBeenCalled();
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

  it('shows error toast and does not redirect when signOut fails', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    mockSignOut.mockResolvedValue({
      error: { message: 'خطای خروج' },
    });

    render(<MainFooterNav />);

    const logoutTab = screen.getByLabelText('خروج');
    await user.click(logoutTab);

    const confirmBtn = screen.getByRole('button', { name: /تایید خروج/i });
    await user.click(confirmBtn);

    expect(mockSignOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('خطای خروج');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('prevents multiple signOut calls and disables button during logout', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    let resolveSignOut: (value: unknown) => void = () => {};
    const signOutPromise = new Promise((resolve) => {
      resolveSignOut = resolve;
    });
    mockSignOut.mockReturnValue(signOutPromise);

    render(<MainFooterNav />);

    const logoutTab = screen.getByLabelText('خروج');

    // Click logout tab to open modal
    await user.click(logoutTab);

    const confirmBtn = screen.getByRole('button', { name: /تایید خروج/i });
    await user.click(confirmBtn);

    // Verify confirm button is disabled while logging out
    expect(confirmBtn).toBeDisabled();

    // Second click (should not trigger another signOut since button is disabled)
    await user.click(confirmBtn);

    expect(mockSignOut).toHaveBeenCalledTimes(1);

    // Resolve the promise
    await act(async () => {
      resolveSignOut({ error: null });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});
