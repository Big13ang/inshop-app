import type { UserMe } from '../services/profileService';
import type { ProfileEditTab } from './components/ProfileEditTabSwitcher';

export type ProfileFormStateKey =
  | 'NEW_USER'
  | 'COMPLETED_USER'
  | 'VERIFIED_SELLER_INCOMPLETE'
  | 'VERIFIED_SELLER_COMPLETED';

export interface ProfileFormStateConfig {
  isSeller: boolean;
  canAccessShopForm: boolean;
  requiresShopCompletion: boolean;
  defaultTab: ProfileEditTab;
}

export const PROFILE_FORM_STATE: Record<ProfileFormStateKey, ProfileFormStateConfig> = {
  NEW_USER: {
    isSeller: false,
    canAccessShopForm: false,
    requiresShopCompletion: false,
    defaultTab: 'userProfile',
  },
  COMPLETED_USER: {
    isSeller: false,
    canAccessShopForm: false,
    requiresShopCompletion: false,
    defaultTab: 'userProfile',
  },
  VERIFIED_SELLER_INCOMPLETE: {
    isSeller: true,
    canAccessShopForm: true,
    requiresShopCompletion: true,
    defaultTab: 'shopProfile',
  },
  VERIFIED_SELLER_COMPLETED: {
    isSeller: true,
    canAccessShopForm: true,
    requiresShopCompletion: false,
    defaultTab: 'userProfile',
  },
};

export function resolveProfileStateKey(user: UserMe | null): ProfileFormStateKey {
  const isVerifiedSeller = Boolean(user?.isVerifiedSeller);
  const hasShopProfile = Boolean(user?.sellerProfile?.id || user?.sellerProfile?.shopName);
  const hasPersonalNames = Boolean(
    (user?.firstName || user?.profile?.name)?.trim() &&
    (user?.lastName || user?.profile?.lastName)?.trim()
  );

  if (isVerifiedSeller) {
    return hasShopProfile
      ? 'VERIFIED_SELLER_COMPLETED'
      : 'VERIFIED_SELLER_INCOMPLETE';
  }

  return hasPersonalNames
    ? 'COMPLETED_USER'
    : 'NEW_USER';
}
