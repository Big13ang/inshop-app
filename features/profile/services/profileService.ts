import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isVerifiedSeller: boolean;
  sellerActivatedAt: string | null;
  isAdmin: boolean;
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
    /** Seller-authored shop description. Not yet returned by every backend build. */
    bio?: string | null;
    /** Whether the address is shown publicly on the seller profile. */
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
  /** Absolute URL of the seller's profile picture. */
  avatarUrl?: string | null;
}

// Deprecated: use UserProfile instead
export type SellerProfile = UserProfile;

export const profileService = {
  useProfile() {
    return useQuery<UserProfile>({
      queryKey: queryKeys.profile.me,
      queryFn: async () => {
        const res = await http.get<UserProfile>('/me');
        if (!res.ok) throw new Error(res.error.message);
        return res.value;
      },
    });
  },
};
