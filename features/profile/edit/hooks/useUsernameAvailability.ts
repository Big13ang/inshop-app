import { useFormContext, useWatch } from 'react-hook-form';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { profileService } from '../../services/profileService';
import { profileSchema, profileSchemaType } from '../editProfileSchema';

export function useUsernameAvailability(currentUsername?: string) {
  const { control, formState: { errors } } = useFormContext<profileSchemaType>();

  const username = useWatch({ control, name: 'username' }) ?? '';
  const debouncedUsername = useDebounce(username.trim(), 400);

  // 1. Live schema validation on user input
  const validation = profileSchema.shape.username.safeParse(username);
  const schemaError = username && !validation.success ? validation.error.issues[0]?.message : undefined;

  // 2. Check backend availability condition
  const isChanged = Boolean(debouncedUsername && debouncedUsername !== currentUsername);
  const shouldCheck = isChanged && profileSchema.shape.username.safeParse(debouncedUsername).success;

  // 3. API Query
  const { isLoading, data } = profileService.useCheckUsername(debouncedUsername, {
    enabled: shouldCheck,
  });

  // 4. Derived states
  const isTaken = shouldCheck && data?.available === false;
  const error = errors.username?.message || schemaError || (isTaken ? 'نام کاربری رزرو شده است' : undefined);
  const hasChecked = shouldCheck ? Boolean(data) : Boolean(schemaError);
  const isAvailable = hasChecked && !error;

  return {
    isLoading,
    isAvailable,
    hasChecked,
    error,
  };
}
