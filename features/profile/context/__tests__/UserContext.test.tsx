import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../UserContext';
import type { UserProfile } from '../../services/profileService';

let mockMe: UserProfile | null = null;

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
      <span data-testid="username">{user?.sellerProfile?.username || 'none'}</span>
    </div>
  );
}

describe('UserContext', () => {
  beforeEach(() => {
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
});
