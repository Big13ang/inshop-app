import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditProfileView } from '../EditProfileView';
import { profileService } from '../../services/profileService';
import { useCreateProfile } from '../../services/profileMutationService';
import { useUpdateUserAccount } from '../../services/profileService';
import { useUser } from '../../context/UserContext';
import type { UserMe } from '../../services/profileService';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/features/auth/hooks/useAuthMutations', () => ({
  useSignOutMutation: jest.fn().mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../services/profileService', () => {
  const actual = jest.requireActual('../../services/profileService');
  return {
    ...actual,
    profileService: {
      ...actual.profileService,
      useMe: jest.fn(),
      useCheckUsername: jest.fn().mockReturnValue({ data: { available: true }, isPending: false }),
    },
    useUpdateUserAccount: jest.fn(),
  };
});

jest.mock('../../services/profileMutationService', () => ({
  useCreateProfile: jest.fn(),
  useUploadProfilePhoto: jest.fn().mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

describe('EditProfileView', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();

  const normalUser: UserMe = {
    id: 'usr-1',
    name: 'علی محمدی',
    email: 'ali@example.com',
    isVerifiedSeller: false,
    sellerActivatedAt: null,
    isAdmin: false,
    firstName: 'علی',
    lastName: 'محمدی',
    description: '',
    nationalId: '0012345678',
    birthDatePersian: '1370-01-01',
    usesWheelchair: false,
    isBlindOrLowVision: false,
    isDeafOrHardOfHearing: false,
    profilePicture: null,
    profile: null,
    businessData: null,
    sellerProfile: null,
  };

  const incompleteSeller: UserMe = {
    ...normalUser,
    id: 'seller-new',
    isVerifiedSeller: true,
    sellerProfile: null,
  };

  const completedSeller: UserMe = {
    ...normalUser,
    id: 'seller-done',
    isVerifiedSeller: true,
    sellerProfile: {
      id: 'sp-1',
      userId: 'seller-done',
      username: 'myshop',
      shopName: 'فروشگاه تستی',
      address: 'خیابان اصلی',
      addressShow: true,
      bio: 'توضیحات فروشگاه',
      phones: [{ id: 'p-1', phoneNumber: '09123456789' }],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    });
    (usePathname as jest.Mock).mockReturnValue('/app/profile/edit');
    (useCreateProfile as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useUpdateUserAccount as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useUser as jest.Mock).mockReturnValue({
      user: normalUser,
      isVerifying: false,
    });
  });

  it('renders user account tab by default for non-seller and renders account form', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    (profileService.useMe as jest.Mock).mockReturnValue({
      data: normalUser,
      isPending: false,
    });

    render(<EditProfileView />);

    expect(screen.getByRole('tab', { name: /حساب کاربری/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /پروفایل فروشگاه/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByPlaceholderText('مثال: محمد')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ذخیره تغییرات/i })).toBeInTheDocument();
  });

  it('renders inline unverified seller content when non-seller is in shopProfile tab and hides footer', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=shopProfile'));
    (profileService.useMe as jest.Mock).mockReturnValue({
      data: normalUser,
      isPending: false,
    });

    render(<EditProfileView />);

    expect(screen.getByRole('tab', { name: /پروفایل فروشگاه/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/شما فروشنده تأیید شده نیستید/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ذخیره تغییرات/i })).not.toBeInTheDocument();
  });

  it('renders first-time seller banner and shop form when verified seller has incomplete profile', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=shopProfile'));
    (profileService.useMe as jest.Mock).mockReturnValue({
      data: incompleteSeller,
      isPending: false,
    });
    (useUser as jest.Mock).mockReturnValue({
      user: incompleteSeller,
      isVerifying: false,
    });

    render(<EditProfileView />);

    expect(screen.getByRole('tab', { name: /پروفایل فروشگاه/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/تکمیل پروفایل فروشگاه/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ذخیره تغییرات/i })).toBeInTheDocument();
  });

  it('toggles URL query param via router.replace when switching tabs', async () => {
    const user = userEvent.setup();
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    (profileService.useMe as jest.Mock).mockReturnValue({
      data: completedSeller,
      isPending: false,
    });
    (useUser as jest.Mock).mockReturnValue({
      user: completedSeller,
      isVerifying: false,
    });

    render(<EditProfileView />);

    const shopTab = screen.getByRole('tab', { name: /پروفایل فروشگاه/i });
    await user.click(shopTab);

    expect(mockReplace).toHaveBeenCalledWith('?tab=shopProfile', { scroll: false });
  });
});
