import { render, screen, fireEvent } from '@testing-library/react';
import { EditProfileView } from '../EditProfileView';
import type { UserMe } from '../../services/profileService';

const mockUseUser = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => mockUseUser(),
}));

jest.mock('../../services/profileMutationService', () => ({
  useCreateProfile: () => ({ mutate: jest.fn(), isPending: false }),
  useUploadProfilePhoto: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../../services/profileService', () => ({
  useUpdateUserAccount: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../hooks/useUsernameAvailability', () => ({
  useUsernameAvailability: () => ({ isLoading: false, isAvailable: true, hasChecked: false }),
}));

function buildUser(shopName: string): UserMe {
  return {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    isVerifiedSeller: true,
    sellerActivatedAt: null,
    isAdmin: false,
    sellerProfile: {
      id: 'seller-1',
      userId: 'user-1',
      username: 'shop',
      shopName,
      address: 'تهران، خیابان آزادی',
      addressShow: true,
    },
  };
}

function setUser(user: UserMe) {
  mockUseUser.mockReturnValue({ user, isVerifying: false });
}

function openShopTab() {
  fireEvent.click(screen.getAllByRole('tab')[1]);
}

describe('EditProfileView', () => {
  it('shows the refetched /me data in the shop form after a save', () => {
    setUser(buildUser('Old Shop'));
    const { rerender } = render(<EditProfileView />);
    openShopTab();

    const shopNameInput = screen.getByLabelText(/نام فروشگاه/) as HTMLInputElement;
    expect(shopNameInput.value).toBe('Old Shop');

    setUser(buildUser('New Shop'));
    rerender(<EditProfileView />);
    openShopTab();

    expect((screen.getByLabelText(/نام فروشگاه/) as HTMLInputElement).value).toBe('New Shop');
  });

  it('keeps unsaved edits when /me refetches with the same data', () => {
    setUser(buildUser('Old Shop'));
    const { rerender } = render(<EditProfileView />);
    openShopTab();

    fireEvent.change(screen.getByLabelText(/نام فروشگاه/), { target: { value: 'Typing…' } });

    setUser(buildUser('Old Shop'));
    rerender(<EditProfileView />);

    expect((screen.getByLabelText(/نام فروشگاه/) as HTMLInputElement).value).toBe('Typing…');
  });
});
