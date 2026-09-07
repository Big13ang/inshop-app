import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { authHttp, http, Result, type ApiResponse } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { debugAuth } from '@/lib/utils/authDebug';
import type { SellerPostsByUsernameData } from '@/features/posts/services/postsQueryService';

export interface SellerProfilePhone {
  id: string;
  sellerProfileId?: string;
  phoneNumber: string;
  label?: string | null;
  createdAt?: string;
}

export interface PublicSellerProfile {
  username: string;
  shopName: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  shopPhoneNumber?: string | null;
  address?: string | null;
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

export function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as {
    response?: { status?: number };
    status?: number;
    statusCode?: number;
  };
  const status = errObj.response?.status ?? errObj.status ?? errObj.statusCode;
  return status === 401;
}

export function shouldRetryProfileQuery(failureCount: number, error: unknown): boolean {
  if (isUnauthorizedError(error)) return false;
  return failureCount < 3;
}

export function getProfileRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 10000);
}

export async function fetchMe(): Promise<UserProfile | null> {
  const result = await Result.try(authHttp.get<ApiResponse<UserProfile>>('/me'));

  if (!result.ok) {
    const isUnauthorized = isUnauthorizedError(result.error);

    debugAuth('profile', isUnauthorized ? 'clientFetchMe:unauthenticated' : 'clientFetchMe:error', {
      errorMessage: result.error instanceof Error ? result.error.message : String(result.error),
    });

    if (isUnauthorized) {
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('[auth] /me request failed on client:', result.error);
    }
    throw result.error instanceof Error ? result.error : new Error(String(result.error));
  }

  return result.value.data;
}

export const profileService = {
  useMe(options?: { initialData?: UserProfile | null; initialDataUpdatedAt?: number }) {
    return useQuery<UserProfile | null>({
      queryKey: queryKeys.profile.me,
      queryFn: fetchMe,
      staleTime: 0,
      retry: shouldRetryProfileQuery,
      retryDelay: getProfileRetryDelay,
      ...options,
    });
  },

  useSuspenseMe(options?: { initialData?: UserProfile | null; initialDataUpdatedAt?: number }) {
    return useSuspenseQuery<UserProfile | null>({
      queryKey: queryKeys.profile.me,
      queryFn: fetchMe,
      staleTime: 0,
      retry: shouldRetryProfileQuery,
      retryDelay: getProfileRetryDelay,
      ...options,
    });
  },

  useUserProfile(
    username?: string,
    options?: { initialData?: SellerPostsByUsernameData; enabled?: boolean }
  ) {
    const trimmed = (username || '').trim();
    const { enabled = true, ...restOptions } = options || {};

    return useQuery<SellerPostsByUsernameData>({
      queryKey: queryKeys.user.byUsername(trimmed),
      queryFn: async () => {
        const res = await http.get<ApiResponse<SellerPostsByUsernameData>>(
          `/posts/seller/username/${encodeURIComponent(trimmed)}`
        );
        return res.data;
      },
      enabled: enabled && trimmed.length > 0,
      staleTime: 1000 * 60 * 5,
      retry: false,
      ...restOptions,
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
