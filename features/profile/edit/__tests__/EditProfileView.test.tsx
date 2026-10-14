import { render, screen, fireEvent } from '@testing-library/react';
import { EditProfileView } from '../EditProfileView';
import type { UserMe } from '../../services/profileService';

const mockUseUser = jest.fn();
const mockPush = jest.fn();
const mockUseMe = jest.fn();
let mockBfcacheId = 'visit-1';
const mockToastWarning = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, bfcacheId: mockBfcacheId }),
}));

jest.mock('sonner', () => ({
  toast: { warning: (message: string) => mockToastWarning(message) },
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
  profileService: { useMe: () => mockUseMe() },
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

function buildFirstTimeSeller(): UserMe {
  return { ...buildUser(''), sellerProfile: null };
}

describe('EditProfileView', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseMe.mockClear();
    mockBfcacheId = 'visit-1';
    mockToastWarning.mockClear();
  });

  it('warns a first-time seller to complete their shop profile when they press cancel', () => {
    setUser(buildFirstTimeSeller());
    render(<EditProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }));

    expect(mockToastWarning).toHaveBeenCalledWith(expect.stringContaining('ابتدا پروفایل فروشگاه خود را تکمیل کنید'));
    expect(mockPush).not.toHaveBeenCalled();
  });

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

  it('discards unsaved edits when the user presses cancel', () => {
    setUser(buildUser('Old Shop'));
    render(<EditProfileView />);
    openShopTab();

    fireEvent.change(screen.getByLabelText(/نام فروشگاه/), { target: { value: 'Typing…' } });
    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }));

    expect((screen.getByLabelText(/نام فروشگاه/) as HTMLInputElement).value).toBe('Old Shop');
  });

  it('subscribes to /me so entering the page refetches it', () => {
    setUser(buildUser('Old Shop'));
    render(<EditProfileView />);

    expect(mockUseMe).toHaveBeenCalled();
  });

  it('drops unsaved edits when the user navigates to the page again', () => {
    setUser(buildUser('Old Shop'));
    const { rerender } = render(<EditProfileView />);
    openShopTab();
    fireEvent.change(screen.getByLabelText(/نام فروشگاه/), { target: { value: 'Typing…' } });

    mockBfcacheId = 'visit-2';
    rerender(<EditProfileView />);
    openShopTab();

    expect((screen.getByLabelText(/نام فروشگاه/) as HTMLInputElement).value).toBe('Old Shop');
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
