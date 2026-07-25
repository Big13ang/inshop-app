import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { optimisticUpdate } from '@/lib/optimistic';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { text } from '../constants';
import type { UserProfile } from './profileService';
import { applyToUserProfile, type UpdateProfilePayload } from '../utils/profileMapper';

export const PROFILE_UPDATE_ENDPOINT = '/seller-profile/me';

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  const patchDto = {
    shopName: payload.shopName,
    bio: payload.bio,
    address: payload.address,
    addressShow: payload.addressShow,
    ...(payload.addressProvince ? { addressProvince: payload.addressProvince } : {}),
    ...(payload.addressCity ? { addressCity: payload.addressCity } : {}),
  };

  const res = await http.patch(PROFILE_UPDATE_ENDPOINT, patchDto);
  if (!res.ok) throw new Error(res.error.message);

  if (payload.avatarUrl && payload.avatarUrl.startsWith('data:')) {
    try {
      const fetchRes = await fetch(payload.avatarUrl);
      const blob = await fetchRes.blob();
      const formData = new FormData();
      formData.append('photo', blob, 'avatar.jpg');

      const photoRes = await http.post('/seller-profile/me/photo', formData);
      if (!photoRes.ok) {
        console.warn('Avatar photo upload warning:', photoRes.error.message);
      }
    } catch (err) {
      console.warn('Failed to upload avatar photo:', err);
    }
  }
}

function applyPayloadToCache(
  payload: UpdateProfilePayload,
  current: UserProfile | undefined,
): UserProfile {
  if (!current) return current as unknown as UserProfile;
  return applyToUserProfile(current, payload);
}

export const profileMutationService = {
  useUpdateProfile(onSaved?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: updateProfile,
      ...optimisticUpdate<UserProfile, UpdateProfilePayload>({
        queryClient,
        queryKey: queryKeys.profile.me,
        updateFn: applyPayloadToCache,
        onSuccess: () => {
          toast.success(text.edit.saveSuccess);
          onSaved?.();
        },
        onError: () => {
          toast.error(ERROR_MESSAGES.profile.updateFailed);
        },
      }),
    });
  },
};
