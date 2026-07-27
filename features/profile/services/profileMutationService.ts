import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http, Result } from '@/lib/utils';
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
  avatarUrl?: string | null;
}

export interface UpdateProfileDto {
  username?: string;
  shopName?: string;
  bio?: string;
  address?: string;
  addressShow?: boolean;
  shopPhoneNumber?: string;
  avatarUrl?: string | null;
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';
  const byteCharacters = atob(base64Data || '');
  const byteNumbers = Array.from(byteCharacters, (character) => character.charCodeAt(0));

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

async function uploadProfilePhoto(avatarDataUrl: string): Promise<void> {
  if (!avatarDataUrl.startsWith('data:')) return;
  try {
    const blob = dataUrlToBlob(avatarDataUrl);
    const formData = new FormData();
    formData.append('photo', blob, 'avatar.jpg');

    const photoRes = await http.post('/user/profile/photo', formData);
    if (!photoRes.ok) {
      console.warn('Avatar photo upload warning:', photoRes.error.message);
    }
  } catch (err) {
    console.warn('Failed to upload avatar photo:', err);
  }
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

  const res = await http.post('/user/profile', payload);
  Result.unwrap(res);

  if (dto.avatarUrl) {
    await uploadProfilePhoto(dto.avatarUrl);
  }
}

export async function updateProfile(dto: UpdateProfileDto): Promise<void> {
  const payload = {
    ...(dto.username ? { username: dto.username } : {}),
    ...(dto.shopName ? { shopName: dto.shopName } : {}),
    ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
    ...(dto.address !== undefined ? { address: dto.address } : {}),
    ...(dto.addressShow !== undefined ? { addressShow: dto.addressShow } : {}),
    ...(dto.shopPhoneNumber ? { shopPhoneNumber: dto.shopPhoneNumber } : {}),
  };

  const res = await http.patch('/user/profile', payload);

  Result.unwrap(res);

  if (dto.avatarUrl) {
    await uploadProfilePhoto(dto.avatarUrl);
  }
}

export const profileMutationService = {
  useCreateProfile(onSaved?: () => void) {
    const queryClient = useQueryClient();

    const handleSuccess = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
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

  useUpdateProfile(onSaved?: () => void) {
    const queryClient = useQueryClient();

    const handleSuccess = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      toast.success(text.edit.saveSuccess);
      onSaved?.();
    };

    const handleError = () => {
      toast.error(ERROR_MESSAGES.profile.updateFailed);
    };

    return useMutation({
      mutationFn: updateProfile,
      onSuccess: handleSuccess,
      onError: handleError,
    });
  },
};
