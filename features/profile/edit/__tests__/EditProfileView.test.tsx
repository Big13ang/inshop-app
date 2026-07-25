import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditProfileView from '../EditProfileView';
import { text } from '../../constants';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import type { UserProfile } from '../../services/profileService';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/app/profile/edit',
}));

const mockMutate = jest.fn();
let mockIsPending = false;

jest.mock('../../services/profileMutationService', () => ({
  profileMutationService: {
    useUpdateProfile: () => ({ mutate: mockMutate, isPending: mockIsPending }),
  },
}));

function makeUser(): UserProfile {
  return {
    id: 'user-1',
    name: 'فرشاد',
    email: 'seller@inshop.ir',
    isVerifiedSeller: true,
    sellerActivatedAt: null,
    isAdmin: false,
    avatarUrl: null,
    profile: {
      id: 1,
      phoneNumber: '09171234567',
      firstName: 'فرشاد',
      lastName: 'تست',
      nationalId: '1234567890',
      status: 'APPROVED',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    businessData: {
      id: 1,
      preRegistrationId: 1,
      shopName: 'گالری طلای مدرن',
      instagramId: 'modern_gold',
      guildId: 'gold',
      address: 'تهران، خیابان پاسداران',
      bio: 'فروش طلا و جواهر',
      showAddress: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  };
}

function renderView() {
  return render(<EditProfileView user={makeUser()} />);
}

beforeEach(() => {
  mockMutate.mockClear();
  mockPush.mockClear();
  mockReplace.mockClear();
  mockIsPending = false;
});

describe('EditProfileView', () => {
  it('prefills every field from the seller profile', () => {
    renderView();

    expect(screen.getByLabelText(/نام فروشگاه/)).toHaveValue('گالری طلای مدرن');
    expect(screen.getByLabelText(/آیدی اختصاصی/)).toHaveValue('modern_gold');
    expect(screen.getByLabelText(/متن معرفی/)).toHaveValue('فروش طلا و جواهر');
    expect(screen.getByLabelText(/نشانی دقیق/)).toHaveValue('تهران، خیابان پاسداران');
    expect(screen.getByLabelText(/شماره تماس فروشگاه/)).toHaveValue('09171234567');
  });

  it('submits the trimmed payload when the form is valid', async () => {
    const user = userEvent.setup();
    renderView();

    const shopName = screen.getByLabelText(/نام فروشگاه/);
    await user.clear(shopName);
    await user.type(shopName, 'فروشگاه تازه');

    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        shopName: 'فروشگاه تازه',
        bio: 'فروش طلا و جواهر',
        address: 'تهران، خیابان پاسداران',
        addressShow: true,
        phoneNumber: '09171234567',
      }),
    );
  });

  it('blocks submission and shows the Persian error for an empty shop name', async () => {
    const user = userEvent.setup();
    renderView();

    await user.clear(screen.getByLabelText(/نام فروشگاه/));
    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    expect(await screen.findByText(ERROR_MESSAGES.profile.shopNameRequired)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('rejects a malformed phone number', async () => {
    const user = userEvent.setup();
    renderView();

    const phone = screen.getByLabelText(/شماره تماس فروشگاه/);
    await user.clear(phone);
    await user.type(phone, '12345');
    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    expect(await screen.findByText(ERROR_MESSAGES.profile.phoneInvalid)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('normalises Persian digits typed into the phone field', async () => {
    const user = userEvent.setup();
    renderView();

    const phone = screen.getByLabelText(/شماره تماس فروشگاه/);
    await user.clear(phone);
    await user.type(phone, '۰۹۱۲۳۴۵۶۷۸۹');

    expect(phone).toHaveValue('09123456789');
  });

  it('requires an address while the visibility switch is on', async () => {
    const user = userEvent.setup();
    renderView();

    await user.clear(screen.getByLabelText(/نشانی دقیق/));
    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    expect(
      await screen.findByText(ERROR_MESSAGES.profile.addressRequiredWhenVisible),
    ).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('allows an empty address once the seller hides it', async () => {
    const user = userEvent.setup();
    renderView();

    await user.clear(screen.getByLabelText(/نشانی دقیق/));
    await user.click(screen.getByRole('switch', { name: text.edit.showAddressLabel }));
    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ address: '', addressShow: false }),
    );
  });

  it('skips the request and returns to the overview when nothing changed', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/app/profile'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('returns to the overview on cancel', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: text.edit.cancelAction }));

    expect(mockReplace).toHaveBeenCalledWith('/app/profile');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows the saving state while the mutation is in flight', () => {
    mockIsPending = true;
    renderView();

    expect(screen.getByRole('button', { name: text.edit.savingAction })).toBeDisabled();
  });
});
