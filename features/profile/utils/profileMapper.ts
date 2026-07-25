import type { UserProfile } from '../services/profileService';
import type { ProfileFormValues } from '../schemas/profileSchema';
import { text } from '../constants';

/**
 * Payload sent to the seller profile update endpoint (/seller-profile/me).
 * Property names match NestJS `UpdateSellerProfileDto` directly.
 */
export interface UpdateProfilePayload {
  shopName: string;
  bio: string;
  address: string;
  addressShow: boolean;
  phoneNumber: string;
  avatarUrl: string | null;
  addressProvince?: string;
  addressCity?: string;
}

export function getShopName(user: UserProfile | null): string {
  return (
    user?.sellerProfile?.shopName?.trim() ||
    user?.businessData?.shopName?.trim() ||
    text.overview.fallbackShopName
  );
}

export function getHandle(user: UserProfile | null): string {
  return (
    user?.sellerProfile?.username?.trim() ||
    user?.businessData?.instagramId?.trim() ||
    text.overview.fallbackHandle
  );
}

export function getPhoneNumber(user: UserProfile | null): string {
  return (
    user?.sellerProfile?.phones?.[0]?.phoneNumber?.trim() ||
    user?.profile?.phoneNumber?.trim() ||
    ''
  );
}

export function getStoreUrl(handle: string): string {
  return `https://inshop.ir/store/${handle}`;
}

export function isAddressVisible(user: UserProfile | null): boolean {
  const address = (
    user?.sellerProfile?.address ??
    user?.businessData?.address ??
    ''
  ).trim();
  if (address === '') return false;
  return user?.sellerProfile?.addressShow ?? user?.businessData?.showAddress !== false;
}

export function toFormValues(user: UserProfile | null): ProfileFormValues {
  return {
    shopName:
      user?.sellerProfile?.shopName?.trim() ??
      user?.businessData?.shopName?.trim() ??
      '',
    handle:
      user?.sellerProfile?.username?.trim() ??
      user?.businessData?.instagramId?.trim() ??
      '',
    bio:
      user?.sellerProfile?.bio?.trim() ??
      user?.businessData?.bio?.trim() ??
      '',
    address:
      user?.sellerProfile?.address?.trim() ??
      user?.businessData?.address?.trim() ??
      '',
    showAddress:
      user?.sellerProfile?.addressShow ??
      user?.businessData?.showAddress ??
      true,
    phoneNumber: getPhoneNumber(user),
    avatar: user?.sellerProfile?.profilePhotoUrl ?? user?.avatarUrl ?? '',
  };
}

export function toUpdatePayload(values: ProfileFormValues): UpdateProfilePayload {
  return {
    shopName: values.shopName.trim(),
    bio: values.bio.trim(),
    address: values.address.trim(),
    addressShow: values.showAddress,
    phoneNumber: values.phoneNumber.trim(),
    avatarUrl: values.avatar || null,
  };
}

/** Merges saved form values back into the cached `/me` response for optimistic updates. */
export function applyToUserProfile(
  user: UserProfile,
  payload: UpdateProfilePayload,
): UserProfile {
  const updatedSellerProfile = {
    ...(user.sellerProfile || {
      id: '',
      userId: user.id,
      username: getHandle(user),
      shopName: payload.shopName,
      bio: payload.bio,
      profilePhotoUrl: payload.avatarUrl,
      address: payload.address,
      addressShow: payload.addressShow,
    }),
    shopName: payload.shopName,
    bio: payload.bio,
    address: payload.address,
    addressShow: payload.addressShow,
    profilePhotoUrl: payload.avatarUrl ?? user.sellerProfile?.profilePhotoUrl ?? null,
  };

  const updatedProfile = user.profile
    ? {
        ...user.profile,
        phoneNumber: payload.phoneNumber,
      }
    : user.profile;

  const updatedBusinessData = user.businessData
    ? {
        ...user.businessData,
        shopName: payload.shopName,
        address: payload.address,
        bio: payload.bio,
        showAddress: payload.addressShow,
      }
    : user.businessData;

  return {
    ...user,
    profile: updatedProfile,
    sellerProfile: updatedSellerProfile,
    businessData: updatedBusinessData,
    avatarUrl: payload.avatarUrl ?? user.avatarUrl,
  };
}
