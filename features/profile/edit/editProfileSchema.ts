import { z } from 'zod';

export const USERNAME_REGEX = /^(?!.*\.\.)(?!^\.)[a-zA-Z0-9._]{1,30}(?<!\.)$/;

export const IRANIAN_SHOP_PHONE_REGEX = /^0[1-9]\d{9}$/;

export const profileSchema = z.object({
    shopName: z
        .string()
        .min(1, 'نام فروشگاه الزامی است')
        .max(45, 'نام فروشگاه باید کمتر از 45 کاراکتر باشد'),
    shopPhoneNumber: z
        .string()
        .regex(
            IRANIAN_SHOP_PHONE_REGEX,
            'شماره تماس معتبر نیست (مثال: 02155555555 یا 09123456789)'
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
    bio: z.string().max(150, 'بایو نباید بیشتر از ۱۵۰ کاراکتر باشد').optional(),
});

export type profileSchemaType = z.infer<typeof profileSchema>;
