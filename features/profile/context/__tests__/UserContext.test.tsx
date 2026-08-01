import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../UserContext';
import type { UserProfile } from '../../services/profileService';

const mockReplace = jest.fn();
let mockPathname = '/app/profile';
let mockMe: UserProfile | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => mockPathname,
}));

jest.mock('../../services/profileService', () => ({
  profileService: {
    useSuspenseMe: () => ({ data: mockMe, error: null }),
  },
}));

function TestConsumer() {
  const { user, isLoggedIn } = useUser();
  return (
    <div>
      <span data-testid="is-logged-in">{isLoggedIn ? 'yes' : 'no'}</span>
      <span data-testid="username">{user?.username || 'none'}</span>
    </div>
  );
}

describe('UserContext', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPathname = '/app/profile';
    mockMe = {
      id: 'u-1',
      sellerProfile: {
        id: 'sp-1',
        userId: 'u-1',
        username: 'test_shop',
        shopName: 'Test Shop',
      },
    };
  });

  it('provides user data to consumer components when logged in with seller profile', () => {
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('yes');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /app/profile/edit when logged in user has null sellerProfile', async () => {
    mockMe = {
      id: 'u-1',
      sellerProfile: null,
    };

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/app/profile/edit');
    });
  });

  it('redirects to /auth/login when user is unauthenticated on protected /app route', async () => {
    mockMe = null;

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('does not redirect when user is already on /app/profile/edit page', async () => {
    mockPathname = '/app/profile/edit';
    mockMe = {
      id: 'u-1',
      sellerProfile: null,
    };

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('yes');
    expect(mockReplace).not.toHaveBeenCalledWith('/app/profile/edit');
  });
});
