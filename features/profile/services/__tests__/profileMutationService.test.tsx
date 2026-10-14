import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authHttp, http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { profileService, type UserMe } from '../profileService';
import { useCreateProfile } from '../profileMutationService';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    authHttp: { get: jest.fn() },
    http: { post: jest.fn() },
  };
});

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockAuthGet = authHttp.get as jest.Mock;
const mockPost = http.post as jest.Mock;

function buildMe(shopName: string): { data: UserMe } {
  return {
    data: {
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      isVerifiedSeller: true,
      sellerActivatedAt: null,
      isAdmin: false,
      sellerProfile: { id: 'seller-1', userId: 'user-1', username: 'shop', shopName },
    },
  };
}

function useMeAndSave() {
  return { me: profileService.useMe(), save: useCreateProfile() };
}

describe('useCreateProfile', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('refetches /me after a successful save so the new data reaches the cache', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    mockAuthGet.mockResolvedValueOnce(buildMe('Old Shop'));
    const { result } = renderHook(useMeAndSave, { wrapper });
    await waitFor(() => expect(result.current.me.data?.sellerProfile?.shopName).toBe('Old Shop'));

    mockPost.mockResolvedValueOnce(undefined);
    mockAuthGet.mockResolvedValueOnce(buildMe('New Shop'));
    await act(() =>
      result.current.save.mutateAsync({
        shopName: 'New Shop',
        shopPhoneNumber: '02155555555',
        username: 'shop',
        address: 'تهران، خیابان آزادی',
        addressShow: true,
      })
    );

    expect(mockPost).toHaveBeenCalledWith('/user/profile', expect.objectContaining({ shopName: 'New Shop' }));
    expect(mockAuthGet).toHaveBeenCalledTimes(2);
    expect(mockAuthGet).toHaveBeenLastCalledWith('/me');
    expect(queryClient.getQueryData<UserMe>(queryKeys.profile.me)?.sellerProfile?.shopName).toBe('New Shop');
    await waitFor(() => expect(result.current.me.data?.sellerProfile?.shopName).toBe('New Shop'));
  });
});
