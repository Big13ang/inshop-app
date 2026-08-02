import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { text } from '../constants';

export interface CreateProfileDto {
  username: string;
  shopName: string;
  bio?: string;
  address?: string;
  addressShow?: boolean;
  shopPhoneNumber: string;
}

export async function createProfile(dto: CreateProfileDto): Promise<void> {
  const payload = {
    username: dto.username,
    shopName: dto.shopName,
    bio: dto.bio,
    address: dto.address,
    addressShow: dto.addressShow,
    shopPhoneNumber: dto.shopPhoneNumber,
  };

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

export const profileMutationService = {
  useCreateProfile(onSaved?: () => void) {
    const queryClient = useQueryClient();

    const handleSuccess = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile }),
      ]);
      toast.success(text.edit.saveSuccess);
      onSaved?.();
    };

    const handleError = () => {
      toast.error(ERROR_MESSAGES.profile.updateFailed);
    };

    return useMutation({
      mutationFn: createProfile,
      onSuccess: handleSuccess,
      onError: handleError,
    });
  },

  useUploadProfilePhoto() {
    const queryClient = useQueryClient();

    const handleSuccess = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile }),
      ]);
      toast.success(text.edit.avatarSelected);
    };

    const handleError = () => {
      toast.error(ERROR_MESSAGES.profile.updateFailed);
    };

    return useMutation({
      mutationFn: uploadProfilePhoto,
      onSuccess: handleSuccess,
      onError: handleError,
    });
  },
};
