import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainFooterNav from '../MainFooterNav';

const mockPush = jest.fn();
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    error: (msg: string) => mockToastError(msg),
  },
}));

const mockSignOut = jest.fn();
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: () => mockSignOut(),
  },
}));

describe('MainFooterNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
  });

  it('renders all navigation tabs', () => {
    render(<MainFooterNav />);
    
    expect(screen.getByLabelText('صف انتظار')).toBeInTheDocument();
    expect(screen.getByLabelText('پست جدید')).toBeInTheDocument();
    expect(screen.getByLabelText('خروج')).toBeInTheDocument();
  });

  it('navigates to pending posts when clicking pending posts tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    render(<MainFooterNav />);

    const pendingTab = screen.getByLabelText('صف انتظار');
    await user.click(pendingTab);

    expect(mockPush).toHaveBeenCalledWith('/app/posts/pending');
  });

  it('navigates to new post when clicking new post tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/pending';
    render(<MainFooterNav />);

    const newPostTab = screen.getByLabelText('پست جدید');
    await user.click(newPostTab);

    expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
  });

  it('calls signOut and redirects to login when clicking logout tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    mockSignOut.mockResolvedValue({ error: null });

    render(<MainFooterNav />);

    const logoutTab = screen.getByLabelText('خروج');
    await user.click(logoutTab);

    expect(mockSignOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('does not navigate if clicking the already active tab', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/pending';
    render(<MainFooterNav />);

    const pendingTab = screen.getByLabelText('صف انتظار');
    await user.click(pendingTab);

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

    expect(mockSignOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('خطای خروج');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('prevents multiple signOut calls and disables tabs during logout', async () => {
    const user = userEvent.setup();
    mockPathname = '/app/posts/new';
    let resolveSignOut: (value: unknown) => void = () => {};
    const signOutPromise = new Promise((resolve) => {
      resolveSignOut = resolve;
    });
    mockSignOut.mockReturnValue(signOutPromise);

    render(<MainFooterNav />);

    const logoutTab = screen.getByLabelText('خروج');
    const pendingTab = screen.getByLabelText('صف انتظار');
    const newPostTab = screen.getByLabelText('پست جدید');

    // First click
    await user.click(logoutTab);

    // Verify that all tabs are disabled while logging out
    expect(logoutTab).toBeDisabled();
    expect(pendingTab).toBeDisabled();
    expect(newPostTab).toBeDisabled();

    // Verify that the loader spinner is rendered inside the logout button
    const spinner = within(logoutTab).getByTestId('logout-spinner');
    expect(spinner).toBeInTheDocument();

    // Second click (should not trigger another signOut since button is disabled)
    await user.click(logoutTab);

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
