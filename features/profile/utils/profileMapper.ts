import type { ProfileFormValues } from '../schemas/profileSchema';
import type { UserProfile } from '../services/profileService';

/**
 * Single Responsibility: Map backend UserProfile schema (whether flat seller profile
 * or containing nested sellerProfile, businessData, or profile sub-objects) into form fields.
 */
export function mapUserProfileToFormValues(user?: UserProfile | null): ProfileFormValues {
  const sellerProfile = user?.sellerProfile;
  const businessData = user?.businessData;
  const profile = user?.profile;

  const shopName =
    user?.shopName ?? sellerProfile?.shopName ?? businessData?.shopName ?? '';
  const username = user?.username ?? sellerProfile?.username ?? '';
  const bio = user?.bio ?? sellerProfile?.bio ?? businessData?.bio ?? '';
  const address =
    user?.address ?? sellerProfile?.address ?? businessData?.address ?? '';
  const showAddress =
    user?.addressShow ??
    sellerProfile?.addressShow ??
    businessData?.showAddress ??
    true;
  const phoneNumber =
    user?.phones?.[0]?.phoneNumber ??
    sellerProfile?.phones?.[0]?.phoneNumber ??
    profile?.phoneNumber ??
    '';
  const profilePhotoUrl =
    user?.profilePhotoUrl ?? sellerProfile?.profilePhotoUrl ?? user?.avatarUrl ?? '';

  return {
    shopName,
    username,
    bio,
    address,
    showAddress,
    phoneNumber,
    profilePhotoUrl,
  };
}
