import { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { profileService, type UserProfile } from '../../services/profileService';
import { profileMutationService } from '../../services/profileMutationService';
import { PROFILE_ROUTES } from '../../constants';

interface UseEditProfileFormOptions {
  initialUser?: UserProfile;
}

export interface EditProfileFormFields {
  username: string;
  shopName: string;
  bio: string;
  address: string;
  showAddress: boolean;
  phoneNumber: string;
  profilePhotoUrl: string;
}

export function useEditProfileForm(options: UseEditProfileFormOptions = {}) {
  const router = useRouter();

  // Queries & Mutations
  const { data: fetchedUser } = profileService.useUserProfile({
    enabled: !options.initialUser,
  });
  const user = options.initialUser ?? fetchedUser;
  const sellerProfile = user?.sellerProfile;

  const updateMutation = profileMutationService.useUpdateProfile();
  const createMutation = profileMutationService.useCreateProfile();

  // Directly access sellerProfile properties
  const defaultValues: EditProfileFormFields = useMemo(
    () => ({
      username: sellerProfile?.username || '',
      shopName: sellerProfile?.shopName || '',
      bio: sellerProfile?.bio || '',
      address: sellerProfile?.address || '',
      showAddress: sellerProfile?.addressShow !== false,
      phoneNumber: sellerProfile?.phones?.[0]?.phoneNumber || '',
      profilePhotoUrl: sellerProfile?.profilePhotoUrl || '',
    }),
    [sellerProfile]
  );

  const form = useForm<EditProfileFormFields>({
    defaultValues,
  });

  // Action handlers
  const handleAvatarChange = useCallback(
    (dataUrl: string) => {
      form.setValue('profilePhotoUrl', dataUrl);
    },
    [form]
  );

  const handleCancel = useCallback(() => {
    router.replace(PROFILE_ROUTES.overview);
  }, [router]);

  const handleSubmit = useCallback(
    form.handleSubmit(() => {
      router.replace(PROFILE_ROUTES.overview);
    }),
    [form, router]
  );

  return {
    user,
    form,
    isSaving: updateMutation.isPending || createMutation.isPending,
    shopNameForAvatar: defaultValues.shopName,
    headerTitle: 'ویرایش پروفایل',
    submitText: 'ذخیره تغییرات',
    handleAvatarChange,
    handleCancel,
    handleSubmit,
  };
}
