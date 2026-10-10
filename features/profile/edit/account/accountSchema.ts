import { z } from 'zod';
import type { UserMe } from '@/features/profile/services/profileService';
import { toEnglishDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';

export const PERSIAN_DATE_REGEX = /^[1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]$/;

export const accountSchema = z.object({
  firstName: z
    .string()
    .nullish()
    .transform((val) => (val ? val.trim() : ''))
    .pipe(
      z
        .string()
        .min(1, 'نام الزامی است')
        .max(50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد'),
    ),
  lastName: z
    .string()
    .nullish()
    .transform((val) => (val ? val.trim() : ''))
    .pipe(
      z
        .string()
        .min(1, 'نام خانوادگی الزامی است')
        .max(50, 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد'),
    ),
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

function extractAccountName(user: UserMe): { firstName: string; lastName: string } {
  const directFirst = (user.firstName || user.profile?.name || '').trim();
  const directLast = (user.lastName || user.profile?.lastName || '').trim();

  if (directFirst || directLast) {
    return {
      firstName: directFirst,
      lastName: directLast,
    };
  }

  const rawName = (user.name || '').trim();
  if (!rawName || /^09\d{9}$/.test(rawName) || rawName.includes('@')) {
    return { firstName: '', lastName: '' };
  }

  const parts = rawName.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function generateDefaultAccountValues(user: UserMe | null): accountSchemaType {
  if (!user) {
    return DEFAULT_ACCOUNT_VALUES;
  }

  const { firstName, lastName } = extractAccountName(user);

  return {
    firstName,
    lastName,
    birthDatePersian: user.birthDatePersian ?? '',
    usesWheelchair: user.usesWheelchair ?? false,
    isBlindOrLowVision: user.isBlindOrLowVision ?? false,
    isDeafOrHardOfHearing: user.isDeafOrHardOfHearing ?? false,
  };
}

