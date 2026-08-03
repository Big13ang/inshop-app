import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { text } from '../constants';
import { profileSchemaType } from '../edit/editProfileSchema';


export async function createProfile(payload: profileSchemaType): Promise<void> {
  await http.post('/user/profile', payload);
}

export async function uploadProfilePhoto(photo: File): Promise<void> {
  const formData = new FormData();
  formData.append('photo', photo);

  await http.post('/user/profile/photo', formData, {
    headers: {
      Accept: 'application/json',
    },
  });
}

export function useCreateProfile(onSaved?: () => void) {
  const queryClient = useQueryClient();

  const handleSuccess = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile }),
    ]);
    toast.success(text.edit.saveSuccess);
    onSaved?.();
  };

  const handleError = (error: Error) => {
    toast.error(error?.message || ERROR_MESSAGES.profile.updateFailed);
  };

  return useMutation({
    mutationFn: createProfile,
    onSuccess: handleSuccess,
    onError: handleError,
  });
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  const handleSuccess = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile }),
    ]);
    toast.success(text.edit.avatarSelected);
  };

  const handleError = (error: Error) => {
    toast.error(error?.message || ERROR_MESSAGES.profile.updateFailed);
  };

  return useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: handleSuccess,
    onError: handleError,
  });
}
