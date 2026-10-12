import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import {
  ContactStoreBottomSheet,
  getStoreContactPhones,
} from '../ContactStoreBottomSheet';
import * as contactModule from '../ContactStoreBottomSheet';
import { ProfileBioSection } from '../ProfileBioSection';
import { text } from '../../../constants';
import * as useIsDesktopModule from '@/lib/hooks/useIsDesktop';
import * as copyModule from '@/lib/utils/copyToClipboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicSellerProfile, SellerProfile } from '../../../services/profileService';

jest.mock('@/lib/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}));

jest.mock('@/features/posts/pending/services/pendingPostsService', () => ({
  usePendingRejectedPosts: () => ({ data: [] }),
}));

jest.mock('@/features/posts/services/sellerPostsService', () => ({
  useInfinitePostsByUsername: () => ({ data: undefined }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('getStoreContactPhones', () => {
  it('returns empty array when profile is undefined', () => {
    expect(getStoreContactPhones(undefined)).toEqual([]);
  });

  it('handles store with only a mobile number in shopPhoneNumber', () => {
    const profile: PublicSellerProfile = {
      username: 'mobile_shop',
      shopName: 'فروشگاه موبایل',
      shopPhoneNumber: '09123456789',
    };

    const phones = getStoreContactPhones(profile);
    expect(phones).toEqual([
      {
        phoneNumber: '09123456789',
        label: text.overview.contactMobileLabel,
        type: 'mobile',
      },
    ]);
  });

  it('handles store with only a landline number in shopPhoneNumber', () => {
    const profile: PublicSellerProfile = {
      username: 'landline_shop',
      shopName: 'فروشگاه ثابت',
      shopPhoneNumber: '02188888888',
    };

    const phones = getStoreContactPhones(profile);
    expect(phones).toEqual([
      {
        phoneNumber: '02188888888',
        label: text.overview.contactLandlineLabel,
        type: 'landline',
      },
    ]);
  });

  it('handles store with phone in phones array for SellerProfile', () => {
    const profile: SellerProfile = {
      id: 'seller-1',
      userId: 'user-1',
      username: 'dual_shop',
      shopName: 'فروشگاه جامع',
      phones: [
        { id: 'p-1', phoneNumber: '09123456789', label: 'موبایل فروشگاه' },
      ],
    };

    const phones = getStoreContactPhones(profile);
    expect(phones).toHaveLength(1);
    expect(phones[0]).toEqual({
      phoneNumber: '09123456789',
      label: 'موبایل فروشگاه',
      type: 'mobile',
    });
  });

  it('handles store with unlabeled phone in phones array', () => {
    const profile: SellerProfile = {
      id: 'seller-1',
      userId: 'user-1',
      username: 'dedup_shop',
      shopName: 'فروشگاه',
      phones: [
        { id: 'p-1', phoneNumber: '09123456789' },
      ],
    };

    const phones = getStoreContactPhones(profile);
    expect(phones).toHaveLength(1);
    expect(phones[0]?.phoneNumber).toBe('09123456789');
  });

  it('normalizes international format (+98 / 0098) and Persian digits', () => {
    const profile: PublicSellerProfile = {
      username: 'norm_shop',
      shopName: 'فروشگاه',
      shopPhoneNumber: '+989123456789',
    };

    const phones = getStoreContactPhones(profile);
    expect(phones[0]?.phoneNumber).toBe('09123456789');
  });

  it('handles store with no contact number', () => {
    const profile: PublicSellerProfile = {
      username: 'empty_shop',
      shopName: 'فروشگاه بی شماره',
      shopPhoneNumber: null,
    };

    expect(getStoreContactPhones(profile)).toEqual([]);
  });
});

describe('ContactStoreBottomSheet Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: displays store contact numbers when isOpen is true', () => {
    const profile: PublicSellerProfile = {
      username: 'my_shop',
      shopName: 'فروشگاه تست',
      shopPhoneNumber: '09123456789',
    };

    render(
      <ContactStoreBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        sellerProfile={profile}
      />
    );

    expect(screen.getByText(text.overview.contactModalTitle)).toBeInTheDocument();
    expect(screen.getByText(text.overview.contactModalSubtitle('فروشگاه تست'))).toBeInTheDocument();
    expect(screen.getByText(text.overview.contactMobileLabel)).toBeInTheDocument();
    expect(screen.getByTestId('store-phone-number')).toHaveTextContent('۰۹۱۲۳۴۵۶۷۸۹');

    const copyBtn = screen.getByTestId('copy-store-phone-btn');
    expect(copyBtn).toBeInTheDocument();

    const callLink = screen.getByTestId('call-store-phone-link');
    expect(callLink).toHaveAttribute('href', 'tel:09123456789');
  });

  it('AC3: displayed number belongs to the currently viewed store', () => {
    const profileA: PublicSellerProfile = {
      username: 'shop_a',
      shopName: 'فروشگاه الف',
      shopPhoneNumber: '09121111111',
    };

    const { rerender } = render(
      <ContactStoreBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        sellerProfile={profileA}
      />
    );

    expect(screen.getByTestId('store-phone-number')).toHaveTextContent('۰۹۱۲۱۱۱۱۱۱۱');

    const profileB: PublicSellerProfile = {
      username: 'shop_b',
      shopName: 'فروشگاه ب',
      shopPhoneNumber: '02188888888',
    };

    rerender(
      <ContactStoreBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        sellerProfile={profileB}
      />
    );

    expect(screen.getByTestId('store-phone-number')).toHaveTextContent('۰۲۱۸۸۸۸۸۸۸۸');
  });

  it('AC4: missing contact number displays appropriate unavailable state and no empty/invalid numbers', () => {
    const profile: PublicSellerProfile = {
      username: 'no_contact_shop',
      shopName: 'فروشگاه بدون شماره',
      shopPhoneNumber: null,
    };

    render(
      <ContactStoreBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        sellerProfile={profile}
      />
    );

    expect(screen.getByTestId('contact-store-unavailable')).toBeInTheDocument();
    expect(screen.getByText(text.overview.contactUnavailableTitle)).toBeInTheDocument();
    expect(screen.getByText(text.overview.contactUnavailableDescription)).toBeInTheDocument();
    expect(screen.queryByTestId('store-phone-number')).not.toBeInTheDocument();
    expect(screen.queryByTestId('copy-store-phone-btn')).not.toBeInTheDocument();
  });

  it('copies phone number to clipboard when copy button is selected', async () => {
    const user = userEvent.setup();
    const profile: PublicSellerProfile = {
      username: 'copy_shop',
      shopName: 'فروشگاه',
      shopPhoneNumber: '09123456789',
    };

    (copyModule.copyToClipboard as jest.Mock).mockImplementation(
      async (_text: string, options?: copyModule.CopyOptions) => {
        options?.onSuccess?.();
        return true;
      }
    );

    render(
      <ContactStoreBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        sellerProfile={profile}
      />
    );

    const copyBtn = screen.getByTestId('copy-store-phone-btn');
    await user.click(copyBtn);

    expect(copyModule.copyToClipboard).toHaveBeenCalledWith(
      '09123456789',
      expect.any(Object)
    );
    expect(toast.success).toHaveBeenCalledWith(text.overview.contactCopied);
  });

  it('calls onClose when header close button is clicked', async () => {
    const user = userEvent.setup();
    const profile: PublicSellerProfile = {
      username: 'close_shop',
      shopName: 'فروشگاه',
      shopPhoneNumber: '09123456789',
    };

    render(
      <ContactStoreBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        sellerProfile={profile}
      />
    );

    const closeBtn = screen.getByRole('button', { name: text.overview.contactCloseAction });
    await user.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('ProfileBioSection Desktop vs Mobile Contact Store Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1 & AC2: on desktop, contact number is hidden by default and displayed after selecting Contact Store', async () => {
    const user = userEvent.setup();
    jest.spyOn(useIsDesktopModule, 'useIsDesktop').mockReturnValue(true);

    const profile: PublicSellerProfile = {
      username: 'desktop_shop',
      shopName: 'فروشگاه دسکتاپ',
      shopPhoneNumber: '09123456789',
    };

    renderWithProviders(<ProfileBioSection sellerProfile={profile} />);

    // AC2: Hidden by default
    expect(screen.queryByTestId('store-phone-number')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contact-store-bottomsheet')).not.toBeInTheDocument();

    // Select "Contact Store" button
    const contactBtn = screen.getByRole('button', { name: text.overview.callAction });
    await user.click(contactBtn);

    // AC1: Displayed inside bottom sheet modal
    expect(screen.getByTestId('contact-store-bottomsheet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: text.overview.contactModalTitle })).toBeInTheDocument();
    expect(screen.getByTestId('store-phone-number')).toHaveTextContent('۰۹۱۲۳۴۵۶۷۸۹');
  });

  it('AC4: on desktop, when store has no contact number, selecting Contact Store opens unavailable state', async () => {
    const user = userEvent.setup();
    jest.spyOn(useIsDesktopModule, 'useIsDesktop').mockReturnValue(true);

    const profile: PublicSellerProfile = {
      username: 'no_num_shop',
      shopName: 'فروشگاه بدون شماره',
      shopPhoneNumber: null,
    };

    renderWithProviders(<ProfileBioSection sellerProfile={profile} />);

    const contactBtn = screen.getByRole('button', { name: text.overview.callAction });
    await user.click(contactBtn);

    expect(screen.getByTestId('contact-store-bottomsheet')).toBeInTheDocument();
    expect(screen.getByTestId('contact-store-unavailable')).toBeInTheDocument();
    expect(screen.getByText(text.overview.contactUnavailableTitle)).toBeInTheDocument();
    expect(screen.queryByTestId('store-phone-number')).not.toBeInTheDocument();
  });

  it('AC5: on mobile, selecting Contact Store maintains existing mobile behavior without opening desktop bottom sheet', async () => {
    const user = userEvent.setup();
    jest.spyOn(useIsDesktopModule, 'useIsDesktop').mockReturnValue(false);
    const callSpy = jest.spyOn(contactModule, 'initiatePhoneCall').mockImplementation(() => {});

    const profile: PublicSellerProfile = {
      username: 'mobile_shop',
      shopName: 'فروشگاه موبایل',
      shopPhoneNumber: '09123456789',
    };

    renderWithProviders(<ProfileBioSection sellerProfile={profile} />);

    const contactBtn = screen.getByRole('button', { name: text.overview.callAction });
    await user.click(contactBtn);

    // Bottom sheet is NOT rendered
    expect(screen.queryByTestId('contact-store-bottomsheet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('store-phone-number')).not.toBeInTheDocument();

    // Mobile action executed
    expect(callSpy).toHaveBeenCalledWith('09123456789');
  });

  it('AC5: on mobile with missing number, triggers error toast and does not open modal', async () => {
    const user = userEvent.setup();
    jest.spyOn(useIsDesktopModule, 'useIsDesktop').mockReturnValue(false);

    const profile: PublicSellerProfile = {
      username: 'mobile_empty',
      shopName: 'فروشگاه موبایل بدون شماره',
      shopPhoneNumber: null,
    };

    renderWithProviders(<ProfileBioSection sellerProfile={profile} />);

    const contactBtn = screen.getByRole('button', { name: text.overview.callAction });
    await user.click(contactBtn);

    expect(screen.queryByTestId('contact-store-bottomsheet')).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(text.overview.callUnavailable);
  });

  it('Edge case: User switches from desktop to mobile layout while modal is open', async () => {
    const user = userEvent.setup();
    const useIsDesktopSpy = jest.spyOn(useIsDesktopModule, 'useIsDesktop').mockReturnValue(true);

    const profile: PublicSellerProfile = {
      username: 'resize_shop',
      shopName: 'فروشگاه ری‌سایز',
      shopPhoneNumber: '09123456789',
    };

    const { rerender } = renderWithProviders(<ProfileBioSection sellerProfile={profile} />);

    // Open on desktop
    const contactBtn = screen.getByRole('button', { name: text.overview.callAction });
    await user.click(contactBtn);
    expect(screen.getByTestId('contact-store-bottomsheet')).toBeInTheDocument();

    // Switch to responsive mobile layout (< 768px)
    useIsDesktopSpy.mockReturnValue(false);
    act(() => {
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ProfileBioSection sellerProfile={profile} />
        </QueryClientProvider>
      );
    });

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByTestId('contact-store-bottomsheet')).not.toBeInTheDocument();
    });
  });
});
