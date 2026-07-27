import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { Result } from '@/lib/utils';
import { profileFormSchema, type ProfileFormValues } from '../../schemas/profileSchema';
import {
  checkUsernameAvailability,
  profileService,
  type UserProfile,
} from '../../services/profileService';
import { profileMutationService } from '../../services/profileMutationService';
import { PROFILE_ROUTES, text } from '../../constants';

interface UseEditProfileFormOptions {
  initialUser?: UserProfile;
}

const CREATE_PROFILE_TITLE = 'تکمیل و ایجاد پروفایل';
const CREATE_PROFILE_SUBMIT_TEXT = 'ایجاد پروفایل';
const USERNAME_TAKEN_MESSAGE = 'این آیدی قبلا ثبت شده است';

export type EditProfileFormFields = ProfileFormValues;

function hasSellerProfile(user?: UserProfile | null) {
  return Boolean(user?.sellerProfile || user?.shopName || user?.username);
}

function getFormValues(user?: UserProfile): EditProfileFormFields {
  const sellerProfile = user?.sellerProfile;

  return {
    username: sellerProfile?.username || user?.username || '',
    shopName: sellerProfile?.shopName || user?.shopName || '',
    bio: sellerProfile?.bio || user?.bio || '',
    address: sellerProfile?.address || user?.address || '',
    showAddress: (sellerProfile?.addressShow ?? user?.addressShow) !== false,
    phoneNumber:
      sellerProfile?.phones?.[0]?.phoneNumber ||
      user?.phones?.[0]?.phoneNumber ||
      user?.profile?.phoneNumber ||
      '',
    profilePhotoUrl:
      sellerProfile?.profilePhotoUrl || user?.profilePhotoUrl || user?.avatarUrl || '',
  };
}

function getResetKey(user?: UserProfile) {
  return [
    user?.userId ?? user?.id ?? 'new',
    user?.sellerProfile?.id ?? user?.id ?? 'create',
    user?.sellerProfile?.updatedAt ?? user?.profile?.updatedAt ?? '',
  ].join(':');
}

function getProfilePayload(values: ProfileFormValues) {
  return {
    username: values.username.trim(),
    shopName: values.shopName.trim(),
    bio: values.bio.trim(),
    address: values.address.trim(),
    addressShow: values.showAddress,
    shopPhoneNumber: values.phoneNumber.trim(),
  };
}

export function useEditProfileForm(options: UseEditProfileFormOptions = {}) {
  const router = useRouter();
  const lastResetKeyRef = useRef<string | null>(null);

  const { data: fetchedUser, isLoading: isQueryLoading } = profileService.useUserProfile({
    enabled: !options.initialUser,
  });
  const user = options.initialUser ?? fetchedUser;
  const isCreateMode = !hasSellerProfile(user);
  const defaultValues = getFormValues(user);
  const resetKey = getResetKey(user);

  const navigateToOverview = () => {
    router.replace(PROFILE_ROUTES.overview);
  };

  const updateMutation = profileMutationService.useUpdateProfile(navigateToOverview);
  const createMutation = profileMutationService.useCreateProfile(navigateToOverview);
  const uploadPhotoMutation = profileMutationService.useUploadProfilePhoto();

  const form = useForm<EditProfileFormFields>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onTouched',
  });
  useEffect(() => {
    // When initialUser is provided (SSR path), the form is already seeded with
    // correct values at mount. Resetting again on re-renders would silently
    // discard any edits the user has made (e.g. bio changes mid-session).
    if (options.initialUser) return;

    if (!user || lastResetKeyRef.current === resetKey) return;

    lastResetKeyRef.current = resetKey;
    form.reset(getFormValues(user));
  }, [form, options.initialUser, resetKey, user]);

  // RHF's formState uses a lazy proxy — a property is only tracked if it is
  // read during render. Reading isDirty here (render phase) ensures RHF
  // subscribes and keeps it up-to-date. The ref then exposes the latest value
  // to the async submit handler without creating a stale closure that the
  // React Compiler could cache.
  const isDirtyRef = useRef(false);
  isDirtyRef.current = form.formState.isDirty;

  const handleAvatarChange = (file: File, previewUrl: string) => {
    form.setValue('profilePhotoUrl', previewUrl);
    uploadPhotoMutation.mutate(file);
  };

  const handleCancel = () => {
    router.replace(PROFILE_ROUTES.overview);
  };

  const onSubmitHandler = async (values: ProfileFormValues) => {
    // Read from the ref (not form.formState directly) so the React Compiler
    // cannot cache a stale render-time value, while still reflecting the
    // latest isDirty state that RHF updated via the render-phase subscription.
    if (!isCreateMode && !isDirtyRef.current) {
      toast.info(text.edit.noChanges);
      navigateToOverview();
      return;
    }

    const payload = getProfilePayload(values);
    const initialUsername = defaultValues.username.trim();
    const isUsernameChanged = payload.username.toLowerCase() !== initialUsername.toLowerCase();

    if (isUsernameChanged && payload.username.length >= 3) {
      const checkResult = await Result.try(checkUsernameAvailability(payload.username));

      if (!checkResult.ok) {
        toast.error(ERROR_MESSAGES.profile.updateFailed);
        return;
      }

      if (!checkResult.value.available) {
        form.setError('username', {
          type: 'manual',
          message: USERNAME_TAKEN_MESSAGE,
        });
        return;
      }
    }

    if (isCreateMode) {
      createMutation.mutate(payload);
      return;
    }

    updateMutation.mutate(payload);
  };

  const handleSubmit = form.handleSubmit(onSubmitHandler);

  return {
    user,
    isLoading: !options.initialUser && isQueryLoading,
    isCreateMode,
    form,
    isSaving: updateMutation.isPending || createMutation.isPending,
    isAvatarUploading: uploadPhotoMutation.isPending,
    shopNameForAvatar: defaultValues.shopName || text.overview.fallbackShopName,
    headerTitle: isCreateMode ? CREATE_PROFILE_TITLE : text.edit.headerTitle,
    submitText: isCreateMode ? CREATE_PROFILE_SUBMIT_TEXT : text.edit.saveAction,
    handleAvatarChange,
    handleCancel,
    handleSubmit,
  };
}
