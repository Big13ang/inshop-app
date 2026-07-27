import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { Result } from '@/lib/utils';
import { profileFormSchema, type ProfileFormValues } from '../../schemas/profileSchema';
import {
  checkUsernameAvailability,
  hasSellerProfile,
  profileService,
  type UserProfile,
} from '../../services/profileService';
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

  const isCreateMode = !hasSellerProfile(user);
  const defaultValues = mapUserProfileToFormValues(user);
  const resetKey = [
    user?.userId ?? user?.id ?? 'new',
    user?.sellerProfile?.id ?? '',
    user?.updatedAt ?? user?.sellerProfile?.updatedAt ?? '',
  ].join(':');
  const lastResetKeyRef = useRef<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onTouched',
  });
  const { reset } = form;

  useEffect(() => {
    if (user && lastResetKeyRef.current !== resetKey) {
      lastResetKeyRef.current = resetKey;
      reset(mapUserProfileToFormValues(user));
    }
  }, [user, reset, resetKey]);

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

  const onSubmitHandler = async (values: ProfileFormValues) => {
    if (!isCreateMode && !isDirty) {
      toast.info(text.edit.noChanges);
      navigateToOverview();
      return;
    }

    const username = values.username.trim();
    const initialUsername = defaultValues.username.trim();
    const isUsernameChanged = username.toLowerCase() !== initialUsername.toLowerCase();

    if (isUsernameChanged && username.length >= 3) {
      const checkResult = await Result.try(checkUsernameAvailability(username));
      if (!checkResult.ok) {
        toast.error(ERROR_MESSAGES.profile.updateFailed);
        return;
      }

      if (!checkResult.value.available) {
        form.setError('username', {
          type: 'manual',
          message: 'این آیدی قبلا ثبت شده است',
        });
        return;
      }
    }

    const payload = {
      username,
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
  const headerTitle = isCreateMode
    ? '\u062a\u06a9\u0645\u06cc\u0644 \u0648 \u0627\u06cc\u062c\u0627\u062f \u067e\u0631\u0648\u0641\u0627\u06cc\u0644'
    : text.edit.headerTitle;
  const submitText = isCreateMode
    ? '\u0627\u06cc\u062c\u0627\u062f \u067e\u0631\u0648\u0641\u0627\u06cc\u0644'
    : text.edit.saveAction;

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
