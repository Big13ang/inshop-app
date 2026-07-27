import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const mockUpdateMutate = jest.fn();
const mockCreateMutate = jest.fn();
let mockIsPending = false;

jest.mock('../../services/profileMutationService', () => ({
  profileMutationService: {
    useUpdateProfile: () => ({ mutate: mockUpdateMutate, isPending: mockIsPending }),
    useCreateProfile: () => ({ mutate: mockCreateMutate, isPending: mockIsPending }),
  },
}));

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    name: 'فرشاد',
    email: 'seller@inshop.ir',
    isVerifiedSeller: true,
    sellerActivatedAt: null,
    isAdmin: false,
    avatarUrl: null,
    sellerProfile: {
      id: 'sp-1',
      userId: 'user-1',
      username: 'modern_gold',
      shopName: 'گالری طلای مدرن',
      bio: 'فروش طلا و جواهر',
      address: 'تهران، خیابان پاسداران',
      addressShow: true,
      phones: [{ id: 'p-1', phoneNumber: '09171234567' }],
    },
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
    ...overrides,
  };
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderView(user = makeUser()) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <EditProfileView user={user} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockUpdateMutate.mockClear();
  mockCreateMutate.mockClear();
  mockPush.mockClear();
  mockReplace.mockClear();
  mockIsPending = false;
});

describe('EditProfileView', () => {
  it('prefills every field from the seller profile in edit mode', () => {
    renderView();

    expect(screen.getByLabelText(/نام فروشگاه/)).toHaveValue('گالری طلای مدرن');
    expect(screen.getByLabelText(/آیدی اختصاصی/)).toHaveValue('modern_gold');
    expect(screen.getByLabelText(/متن معرفی/)).toHaveValue('فروش طلا و جواهر');
    expect(screen.getByLabelText(/نشانی دقیق/)).toHaveValue('تهران، خیابان پاسداران');
    expect(screen.getByLabelText(/شماره تماس فروشگاه/)).toHaveValue('09171234567');
  });

  it('submits update mutation when editing an existing profile', async () => {
    const user = userEvent.setup();
    renderView();

    const shopName = screen.getByLabelText(/نام فروشگاه/);
    await user.clear(shopName);
    await user.type(shopName, 'فروشگاه تازه');

    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    await waitFor(() => expect(mockUpdateMutate).toHaveBeenCalledTimes(1));
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        shopName: 'فروشگاه تازه',
        username: 'modern_gold',
        bio: 'فروش طلا و جواهر',
        address: 'تهران، خیابان پاسداران',
        addressShow: true,
        shopPhoneNumber: '09171234567',
      }),
    );
  });

  it('submits create mutation when user has no seller profile', async () => {
    const user = userEvent.setup();
    const newSellerUser = makeUser({ sellerProfile: undefined, businessData: undefined, profile: undefined });
    renderView(newSellerUser);

    await user.type(screen.getByLabelText(/نام فروشگاه/), 'فروشگاه جدید');
    await user.type(screen.getByLabelText(/آیدی اختصاصی/), 'new_shop');
    await user.type(screen.getByLabelText(/متن معرفی/), 'توضیحات جدید');
    await user.type(screen.getByLabelText(/نشانی دقیق/), 'تهران');
    await user.type(screen.getByLabelText(/شماره تماس فروشگاه/), '09121111111');

    await user.click(screen.getByRole('button', { name: 'ایجاد پروفایل' }));

    await waitFor(() => expect(mockCreateMutate).toHaveBeenCalledTimes(1));
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        shopName: 'فروشگاه جدید',
        username: 'new_shop',
        bio: 'توضیحات جدید',
        address: 'تهران',
        shopPhoneNumber: '09121111111',
      }),
    );
  });

  it('blocks submission and shows Persian error for empty shop name', async () => {
    const user = userEvent.setup();
    renderView();

    await user.clear(screen.getByLabelText(/نام فروشگاه/));
    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    expect(await screen.findByText(ERROR_MESSAGES.profile.shopNameRequired)).toBeInTheDocument();
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('rejects a malformed phone number', async () => {
    const user = userEvent.setup();
    renderView();

    const phone = screen.getByLabelText(/شماره تماس فروشگاه/);
    await user.clear(phone);
    await user.type(phone, '12345');
    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    expect(await screen.findByText(ERROR_MESSAGES.profile.phoneInvalid)).toBeInTheDocument();
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('normalises Persian digits typed into the phone field', async () => {
    const user = userEvent.setup();
    renderView();

    const phone = screen.getByLabelText(/شماره تماس فروشگاه/);
    await user.clear(phone);
    await user.type(phone, '۰۹۱۲۳۴۵۶۷۸۹');

    expect(phone).toHaveValue('09123456789');
  });

  it('skips request and returns to overview when nothing changed in edit mode', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: text.edit.saveAction }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/app/profile'));
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('returns to overview on cancel in edit mode', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: text.edit.cancelAction }));

    expect(mockReplace).toHaveBeenCalledWith('/app/profile');
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('shows saving state while mutation is pending', () => {
    mockIsPending = true;
    renderView();

    expect(screen.getByRole('button', { name: text.edit.savingAction })).toBeDisabled();
  });
});
