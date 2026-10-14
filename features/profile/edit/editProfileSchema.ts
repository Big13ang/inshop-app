import { z } from 'zod';
import { toEnglishDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';

export const USERNAME_REGEX = /^(?!.*\.\.)(?!^\.)[a-zA-Z0-9._]{1,30}(?<!\.)$/;

export const IRANIAN_SHOP_PHONE_REGEX = /^0[1-9]\d{9,10}$/;

export function normalizeShopPhoneNumber(val: string): string {
    const cleaned = toEnglishDigits(val?.trim() ?? '').replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+98')) {
        return `0${cleaned.slice(3)}`;
    }
    if (cleaned.startsWith('0098')) {
        return `0${cleaned.slice(4)}`;
    }
    return cleaned;
}

export const profileSchema = z.object({
    shopName: z
        .string()
        .min(1, 'نام فروشگاه الزامی است')
        .max(45, 'نام فروشگاه باید کمتر از 45 کاراکتر باشد'),
    shopPhoneNumber: z
        .string()
        .transform((val) => normalizeShopPhoneNumber(val))
        .pipe(
            z.string().regex(
                IRANIAN_SHOP_PHONE_REGEX,
                'شماره تماس معتبر نیست (مثال: 02155555555 یا 09123456789)'
            )
        ),
    username: z
        .string()
        .min(1, 'نام کاربری الزامی است')
        .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
        .max(30, 'نام کاربری نباید بیشتر از ۳۰ کاراکتر باشد')
        .regex(USERNAME_REGEX, 'نام کاربری فرمت معتبر ندارد'),
    address: z
        .string()
        .min(1, 'آدرس الزامی است')
        .min(10, 'آدرس باید حداقل ۱۰ کاراکتر باشد')
        .max(80, 'آدرس نباید بیشتر از ۸۰ کاراکتر باشد'),
    addressShow: z.boolean(),
    instagramFollowersCount: z
        .string()
        .transform((val) => toEnglishDigits(val.trim()))
        .pipe(z.string().regex(/^\d*$/, 'تعداد دنبال‌کننده باید فقط عدد باشد'))
        .optional(),
    instagramUsername: z
        .string()
        .refine((val) => val === '' || val.length >= 3, 'آیدی اینستاگرام باید حداقل ۳ کاراکتر باشد')
        .refine((val) => val.length <= 30, 'آیدی اینستاگرام نباید بیشتر از ۳۰ کاراکتر باشد')
        .refine((val) => val === '' || USERNAME_REGEX.test(val), 'آیدی اینستاگرام فرمت معتبر ندارد')
        .optional(),
    bio: z.string().max(150, 'بایو نباید بیشتر از ۱۵۰ کاراکتر باشد').optional(),
});

export type profileSchemaType = z.infer<typeof profileSchema>;
