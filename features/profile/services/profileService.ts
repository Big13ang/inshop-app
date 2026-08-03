import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { http, type ApiResponse } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';

export interface SellerProfilePhone {
  id: string;
  sellerProfileId?: string;
  phoneNumber: string;
  label?: string | null;
  createdAt?: string;
}

export interface SellerProfile {
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
  phones?: SellerProfilePhone[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreRegisterProfile {
  id: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  nationalIdNumber: string;
  province: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreRegisterBusinessData {
  id: number;
  preRegistrationId: number;
  instagramId?: string | null;
  followersCount?: string | null;
  businessType?: string | null;
  productCategory?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserMe {
  id: string;
  name: string;
  email: string;
  isVerifiedSeller: boolean;
  sellerActivatedAt: string | null;
  isAdmin: boolean;
  profile?: UserPreRegisterProfile | null;
  businessData?: UserPreRegisterBusinessData | null;
  sellerProfile: SellerProfile | null;
}

export type UserProfile = UserMe;

export interface CheckUsernameResponse {
  username: string;
  available: boolean;
}

export interface UseCheckUsernameOptions {
  enabled?: boolean;
}

export async function checkUsernameAvailability(username: string): Promise<CheckUsernameResponse> {
  const trimmed = (username || '').trim();

  const res = await http.get<ApiResponse<CheckUsernameResponse>>(
    `/user/profile/check-username/${encodeURIComponent(trimmed)}`
  );

  return res.data;
}

export const profileService = {
  useMe() {
    return useQuery<UserMe>({
      queryKey: queryKeys.profile.me,
      queryFn: async () => {
        const res = await http.get<ApiResponse<UserMe>>('/me');
        return res.data;
      },
    });
  },

  useSuspenseMe() {
    return useSuspenseQuery<UserMe>({
      queryKey: queryKeys.profile.me,
      queryFn: async () => {
        const res = await http.get<ApiResponse<UserMe>>('/me');
        return res.data;
      },
    });
  },

  useUserProfile(options?: { initialData?: SellerProfile; enabled?: boolean }) {
    return useQuery<SellerProfile>({
      queryKey: queryKeys.user.profile,
      queryFn: async () => {
        const res = await http.get<ApiResponse<SellerProfile>>('/user/profile');
        return res.data;
      },
      staleTime: 1000 * 60 * 5,
      retry: false,
      ...options,
    });
  },

  useCheckUsername(username?: string, options: UseCheckUsernameOptions = {}) {
    const { enabled = true } = options;
    const trimmed = (username || '').trim();

    return useQuery<CheckUsernameResponse>({
      queryKey: queryKeys.profile.checkUsername(trimmed),
      queryFn: async () => checkUsernameAvailability(trimmed),
      enabled: enabled && trimmed.length >= 3,
      staleTime: 0,
      retry: false,
    });
  },
};
