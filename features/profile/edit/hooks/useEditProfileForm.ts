import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { profileFormSchema, type ProfileFormValues } from '../../schemas/profileSchema';
import { profileService, type UserProfile } from '../../services/profileService';
import { profileMutationService } from '../../services/profileMutationService';
import { mapUserProfileToFormValues } from '../../utils/profileMapper';
import { PROFILE_ROUTES, text } from '../../constants';

interface UseEditProfileFormOptions {
  initialUser?: UserProfile;
}

export function useEditProfileForm(options: UseEditProfileFormOptions = {}) {
  const router = useRouter();
  const { data: fetchedUser, isLoading: isQueryLoading } = profileService.useUserProfile({
    enabled: !options.initialUser,
  });
  const user = options.initialUser ?? fetchedUser;
  const isLoading = !options.initialUser && isQueryLoading;

  const sellerProfile = user?.sellerProfile;
  const isCreateMode =
    !user?.username &&
    !sellerProfile?.username &&
    !sellerProfile?.id;
  const defaultValues = mapUserProfileToFormValues(user);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (user) {
      form.reset(mapUserProfileToFormValues(user));
    }
  }, [user, form]);

  const navigateToOverview = () => {
    router.replace(PROFILE_ROUTES.overview);
  };

  const updateMutation = profileMutationService.useUpdateProfile(navigateToOverview);
  const createMutation = profileMutationService.useCreateProfile(navigateToOverview);

  const handleAvatarChange = (dataUrl: string) => {
    form.setValue('profilePhotoUrl', dataUrl, { shouldDirty: true });
  };

  const handleCancel = () => {
    if (isCreateMode) {
      router.replace(PROFILE_ROUTES.pendingPosts);
    } else {
      navigateToOverview();
    }
  };

  const { isDirty } = form.formState;

  const onSubmitHandler = (values: ProfileFormValues) => {
    if (!isCreateMode && !isDirty) {
      toast.info(text.edit.noChanges);
      navigateToOverview();
      return;
    }

    const payload = {
      username: values.username.trim(),
      shopName: values.shopName.trim(),
      bio: values.bio.trim(),
      address: values.address.trim(),
      addressShow: values.showAddress,
      shopPhoneNumber: values.phoneNumber.trim(),
      avatarUrl: values.profilePhotoUrl || null,
    };

    if (isCreateMode) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmitHandler);

  const isSaving = updateMutation.isPending || createMutation.isPending;
  const shopNameForAvatar = defaultValues.shopName || text.overview.fallbackShopName;
  const headerTitle = isCreateMode ? 'تکمیل و ایجاد پروفایل' : text.edit.headerTitle;
  const submitText = isCreateMode ? 'ایجاد پروفایل' : text.edit.saveAction;

  return {
    user,
    isLoading,
    form,
    isCreateMode,
    isSaving,
    shopNameForAvatar,
    headerTitle,
    submitText,
    handleAvatarChange,
    handleCancel,
    handleSubmit,
  };
}
