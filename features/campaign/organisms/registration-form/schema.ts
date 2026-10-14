import * as z from 'zod';
import { USERNAME_REGEX } from '@/features/profile/edit/editProfileSchema';

export const FIELD_MAX_LENGTH = 120;
export const NAME_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 500;

const namePattern = /^[\u0600-\u06FF\s]+$/;
const phonePattern = /^09\d{9}$/;
const nationalIdPattern = /^[0-9]{10}$/;

export const sanitizeText = (value: string) =>
  value
    .replace(/[<>`"'\\]/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t\f\v]+/g, ' ').trim())
    .join('\n')
    .trim();


export const step1Schema = z.object({
  firstName: z.string()
    .trim()
    .min(1, 'نام الزامی است')
    .max(NAME_MAX_LENGTH, `نام نمی‌تواند بیشتر از ${NAME_MAX_LENGTH} کاراکتر باشد`)
    .regex(namePattern, 'نام فقط می‌تواند شامل حروف و فاصله باشد'),
  lastName: z.string()
    .trim()
    .min(1, 'نام خانوادگی الزامی است')
    .max(NAME_MAX_LENGTH, `نام خانوادگی نمی‌تواند بیشتر از ${NAME_MAX_LENGTH} کاراکتر باشد`)
    .regex(namePattern, 'نام خانوادگی فقط می‌تواند شامل حروف و فاصله باشد'),
  mobile: z.string()
    .trim()
    .min(1, 'شماره موبایل الزامی است')
    .max(FIELD_MAX_LENGTH)
    .regex(phonePattern, 'فرمت شماره موبایل نامعتبر است'),
  nationalId: z.string()
    .trim()
    .min(1, 'کد ملی الزامی است')
    .max(10, 'کد ملی نمی‌تواند بیشتر از ۱۰ کاراکتر باشد')
    .regex(nationalIdPattern, 'کد ملی باید دقیقاً ۱۰ رقم باشد'),
  province: z.string().trim().max(FIELD_MAX_LENGTH).min(1, 'استان را انتخاب کنید'),
  city: z.string().trim().max(FIELD_MAX_LENGTH).min(1, 'شهر را انتخاب کنید'),
});

export const step2Schema = z.object({
  // Same rules as `instagramUsername` on /profile/edit, but required here.
  storeId: z.string()
    .trim()
    .min(1, 'آیدی اینستاگرام الزامی است')
    .min(3, 'آیدی اینستاگرام باید حداقل ۳ کاراکتر باشد')
    .max(30, 'آیدی اینستاگرام نباید بیشتر از ۳۰ کاراکتر باشد')
    .regex(USERNAME_REGEX, 'آیدی اینستاگرام فرمت معتبر ندارد'),
  followers: z.string().trim().max(FIELD_MAX_LENGTH).min(1, 'تعداد فالوور را انتخاب کنید'),
  category: z.string().trim().max(FIELD_MAX_LENGTH).min(1, 'دسته را انتخاب کنید'),
  description: z.string()
    .trim()
    .min(1, 'توضیحات فروشگاه الزامی است')
    .max(DESCRIPTION_MAX_LENGTH, `توضیحات نمی‌تواند بیشتر از ${DESCRIPTION_MAX_LENGTH} کاراکتر باشد`),
});

export const registrationSchema = step1Schema.merge(step2Schema);
export type RegistrationData = z.infer<typeof registrationSchema>;

export const defaultRegistrationValues: RegistrationData = {
  firstName: '',
  lastName: '',
  mobile: '',
  nationalId: '',
  province: '',
  city: '',
  storeId: '',
  followers: '',
  category: '',
  description: '',
};
