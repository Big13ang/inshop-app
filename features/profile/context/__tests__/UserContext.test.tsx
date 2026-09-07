import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../UserContext';
import type { UserProfile } from '../../services/profileService';

let mockMe: UserProfile | null = null;
let mockError: Error | null = null;
let mockDataUpdatedAt = 1;

jest.mock('../../services/profileService', () => ({
  isUnauthorizedError: (error: unknown) => {
    if (!error || typeof error !== 'object') return false;
    return (error as { response?: { status?: number } })?.response?.status === 401;
  },
  profileService: {
    useMe: () => ({
      data: mockMe,
      error: mockError,
      dataUpdatedAt: mockDataUpdatedAt,
      refetch: jest.fn(),
    }),
    useSuspenseMe: () => ({
      data: mockMe,
      error: mockError,
      dataUpdatedAt: mockDataUpdatedAt,
      refetch: jest.fn(),
    }),
  },
}));

function TestConsumer() {
  const { user, isLoggedIn, isRetryableError, isVerifying } = useUser();
  return (
    <div>
      <span data-testid="is-logged-in">{isLoggedIn ? 'yes' : 'no'}</span>
      <span data-testid="username">{user?.sellerProfile?.username || 'none'}</span>
      <span data-testid="is-retryable">{isRetryableError ? 'yes' : 'no'}</span>
      <span data-testid="is-verifying">{isVerifying ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('UserContext', () => {
  beforeEach(() => {
    mockError = null;
    mockDataUpdatedAt = 1;
    mockMe = {
      id: 'u-1',
      name: 'Test User',
      email: 'test@example.com',
      isVerifiedSeller: true,
      sellerActivatedAt: '2026-01-01T00:00:00Z',
      isAdmin: false,
      sellerProfile: {
        id: 'sp-1',
        userId: 'u-1',
        username: 'test_shop',
        shopName: 'Test Shop',
      },
    };
  });

  it('provides user data to consumer components when logged in', () => {
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('yes');
    expect(screen.getByTestId('username')).toHaveTextContent('test_shop');
  });

  it('provides user data when sellerProfile is null', () => {
    mockMe = {
      id: 'u-1',
      name: 'Test User',
      email: 'test@example.com',
      isVerifiedSeller: false,
      sellerActivatedAt: null,
      isAdmin: false,
      sellerProfile: null,
    };

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('yes');
  });

  it('indicates unauthenticated state when user is null', () => {
    mockMe = null;

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('no');
  });

  it('preserves cached user and isLoggedIn=true when transient 5xx/network error occurs', () => {
    mockError = Object.assign(new Error('502 Bad Gateway'), { response: { status: 502 } });

    render(
      <UserProvider initialUser={mockMe}>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('yes');
    expect(screen.getByTestId('username')).toHaveTextContent('test_shop');
    expect(screen.getByTestId('is-retryable')).toHaveTextContent('yes');
  });

  it('flags isRetryableError=true when 500/network error occurs on cold start without user', () => {
    mockMe = null;
    mockError = Object.assign(new Error('Network Error'), { response: { status: 500 } });

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('no');
    expect(screen.getByTestId('is-retryable')).toHaveTextContent('yes');
  });

  it('does not flag isRetryableError when error is genuine 401', () => {
    mockMe = null;
    mockError = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('no');
    expect(screen.getByTestId('is-retryable')).toHaveTextContent('no');
  });
});
