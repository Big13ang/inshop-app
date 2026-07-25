import { z } from 'zod';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { PROFILE_LIMITS } from '../constants';

const IRANIAN_MOBILE_PATTERN = /^09\d{9}$/;
const HANDLE_PATTERN = /^[a-zA-Z0-9_.]+$/;

const shopNameSchema = z
  .string({ message: ERROR_MESSAGES.profile.shopNameRequired })
  .trim()
  .min(1, { message: ERROR_MESSAGES.profile.shopNameRequired })
  .min(PROFILE_LIMITS.shopName.min, {
    message: ERROR_MESSAGES.profile.shopNameTooShort(PROFILE_LIMITS.shopName.min),
  })
  .max(PROFILE_LIMITS.shopName.max, {
    message: ERROR_MESSAGES.profile.shopNameTooLong(PROFILE_LIMITS.shopName.max),
  });

// The handle is optional, so an empty string must short-circuit before the
// length/pattern checks instead of reporting "too short" on an untouched field.
const handleSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || value.length >= PROFILE_LIMITS.handle.min, {
    message: ERROR_MESSAGES.profile.handleTooShort(PROFILE_LIMITS.handle.min),
  })
  .refine((value) => value.length <= PROFILE_LIMITS.handle.max, {
    message: ERROR_MESSAGES.profile.handleTooLong(PROFILE_LIMITS.handle.max),
  })
  .refine((value) => value === '' || HANDLE_PATTERN.test(value), {
    message: ERROR_MESSAGES.profile.handleInvalid,
  });

const bioSchema = z.string().trim().max(PROFILE_LIMITS.bio.max, {
  message: ERROR_MESSAGES.profile.bioTooLong(PROFILE_LIMITS.bio.max),
});

const addressSchema = z.string().trim().max(PROFILE_LIMITS.address.max, {
  message: ERROR_MESSAGES.profile.addressTooLong(PROFILE_LIMITS.address.max),
});

const phoneSchema = z
  .string({ message: ERROR_MESSAGES.profile.phoneRequired })
  .trim()
  .min(1, { message: ERROR_MESSAGES.profile.phoneRequired })
  .regex(IRANIAN_MOBILE_PATTERN, { message: ERROR_MESSAGES.profile.phoneInvalid });

export const profileFormSchema = z
  .object({
    shopName: shopNameSchema,
    handle: handleSchema,
    bio: bioSchema,
    address: addressSchema,
    showAddress: z.boolean(),
    phoneNumber: phoneSchema,
    avatar: z.string(),
  })
  .refine((values) => !values.showAddress || values.address.length > 0, {
    message: ERROR_MESSAGES.profile.addressRequiredWhenVisible,
    path: ['address'],
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
