import { z } from 'zod';
import type { UserMe } from '@/features/profile/services/profileService';
import { toEnglishDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';

export const NATIONAL_ID_REGEX = /^[0-9]{10}$/;
export const PERSIAN_DATE_REGEX = /^[1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]$/;

export const accountSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'نام الزامی است')
    .max(50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد'),
  lastName: z
    .string()
    .trim()
    .min(1, 'نام خانوادگی الزامی است')
    .max(50, 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد'),
  nationalId: z
    .string()
    .transform((val) => toEnglishDigits(val.trim()))
    .pipe(
      z
        .string()
        .min(1, 'کد ملی الزامی است')
        .regex(NATIONAL_ID_REGEX, 'کد ملی باید دقیقا ۱۰ رقم باشد')
    ),
  birthDatePersian: z
    .string()
    .transform((val) => (val ? toEnglishDigits(val.trim()).replace(/\//g, '-') : ''))
    .refine((val) => !val || PERSIAN_DATE_REGEX.test(val), {
      message: 'فرمت تاریخ تولد نامعتبر است',
    }),
  usesWheelchair: z.boolean(),
  isBlindOrLowVision: z.boolean(),
  isDeafOrHardOfHearing: z.boolean(),
});

export type accountSchemaType = z.infer<typeof accountSchema>;

export const DEFAULT_ACCOUNT_VALUES: accountSchemaType = {
  firstName: '',
  lastName: '',
  nationalId: '',
  birthDatePersian: '',
  usesWheelchair: false,
  isBlindOrLowVision: false,
  isDeafOrHardOfHearing: false,
};

export function generateDefaultAccountValues(user: UserMe | null): accountSchemaType {
  if (!user) {
    return DEFAULT_ACCOUNT_VALUES;
  }

  const profile = user.profile;
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    nationalId: user.nationalId ?? profile?.nationalIdNumber ?? '',
    birthDatePersian: user.birthDatePersian ?? '',
    usesWheelchair: user.usesWheelchair ?? false,
    isBlindOrLowVision: user.isBlindOrLowVision ?? false,
    isDeafOrHardOfHearing: user.isDeafOrHardOfHearing ?? false,
  };
}
