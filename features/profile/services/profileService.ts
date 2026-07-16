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
    guildId: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  };
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
