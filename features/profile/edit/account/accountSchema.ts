import { z } from 'zod';
import type { UserMe } from '@/features/profile/services/profileService';
import { toEnglishDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';

export const PERSIAN_DATE_REGEX = /^[1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]$/;

export const accountSchema = z.object({
  firstName: z
    .string()
    .nullish()
    .transform((val) => (val ? val.trim() : ''))
    .pipe(z.string().max(50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد')),
  lastName: z
    .string()
    .nullish()
    .transform((val) => (val ? val.trim() : ''))
    .pipe(z.string().max(50, 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد')),
  birthDatePersian: z
    .string()
    .nullish()
    .transform((val) => (val ? toEnglishDigits(val.trim()).replace(/\//g, '-') : ''))
    .refine((val) => !val || PERSIAN_DATE_REGEX.test(val), {
      message: 'فرمت تاریخ تولد نامعتبر است',
    }),
  usesWheelchair: z
    .boolean()
    .nullish()
    .transform((val) => Boolean(val)),
  isBlindOrLowVision: z
    .boolean()
    .nullish()
    .transform((val) => Boolean(val)),
  isDeafOrHardOfHearing: z
    .boolean()
    .nullish()
    .transform((val) => Boolean(val)),
});

export type accountSchemaType = z.infer<typeof accountSchema>;
export type accountSchemaInput = z.input<typeof accountSchema>;

export const DEFAULT_ACCOUNT_VALUES: accountSchemaType = {
  firstName: '',
  lastName: '',
  birthDatePersian: '',
  usesWheelchair: false,
  isBlindOrLowVision: false,
  isDeafOrHardOfHearing: false,
};

export function generateDefaultAccountValues(user: UserMe | null): accountSchemaType {
  if (!user) {
    return DEFAULT_ACCOUNT_VALUES;
  }

  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    birthDatePersian: user.birthDatePersian ?? '',
    usesWheelchair: user.usesWheelchair ?? false,
    isBlindOrLowVision: user.isBlindOrLowVision ?? false,
    isDeafOrHardOfHearing: user.isDeafOrHardOfHearing ?? false,
  };
}
