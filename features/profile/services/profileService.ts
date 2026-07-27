import { useQuery } from '@tanstack/react-query';
import { http, Result } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { queryKeys } from '@/lib/query-keys';

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  isVerifiedSeller?: boolean;
  sellerActivatedAt?: string | null;
  isAdmin?: boolean;
  userId?: string;
  username?: string;
  shopName?: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  address?: string | null;
  addressProvince?: string | null;
  addressCity?: string | null;
  addressShow?: boolean;
  phones?: Array<{
    id?: string;
    phoneNumber: string;
    label?: string | null;
  }>;
  profile?: {
    id: number;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  businessData?: {
    id: number;
    preRegistrationId: number;
    shopName: string;
    instagramId?: string | null;
    guildId: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    bio?: string | null;
    showAddress?: boolean | null;
  };
  sellerProfile?: {
    id: string;
    userId: string;
    username: string;
    shopName: string;
    bio?: string | null;
    profilePhotoUrl?: string | null;
    address?: string | null;
    addressProvince?: string | null;
    addressCity?: string | null;
    addressShow?: boolean;
    createdAt?: string;
    updatedAt?: string;
    phones?: Array<{
      id: string;
      phoneNumber: string;
      label?: string | null;
    }>;
  };
  avatarUrl?: string | null;
}

export type SellerProfile = UserProfile;

export interface CheckUsernameResponse {
  username: string;
  available: boolean;
  reason?: string;
}

export interface UseCheckUsernameOptions {
  enabled?: boolean;
  debounceMs?: number;
}


export const profileService = {
  useMe() {
    return useQuery<UserProfile>({
      queryKey: queryKeys.profile.me,
      queryFn: async () => Result.unwrap(await http.get<UserProfile>('/me')),
    });
  },

  useUserProfile(options?: { initialData?: UserProfile; enabled?: boolean }) {
    return useQuery<UserProfile>({
      queryKey: queryKeys.user.profile,
      queryFn: async () => Result.unwrap(await http.get<UserProfile>('/user/profile')),
      staleTime: 1000 * 60 * 5,
      retry: false,
      ...options,
    });
  },

  useCheckUsername(username: string, options: UseCheckUsernameOptions = {}) {
    const { enabled = true, debounceMs = 400 } = options;
    const trimmed = useDebounce(username.trim(), debounceMs);

    return useQuery<CheckUsernameResponse>({
      queryKey: queryKeys.profile.checkUsername(trimmed),
      queryFn: async () => Result.unwrap(await http.get<CheckUsernameResponse>(
        `/user/profile/check-username/${encodeURIComponent(trimmed)}`
      )),
      enabled: enabled && trimmed.length >= 3,
      staleTime: 1000 * 60 * 5,
      retry: false,
    });
  },
};
