import { z } from 'zod';

export const profileSchema = z.object({
    shopName: z.string().min(1, 'نام فروشگاه الزامی است'),
    shopPhoneNumber: z
        .string()
        .length(11, 'شماره تلفن فروشگاه الزامی است')
        .regex(/^[0-9]+$/, 'شماره تلفن باید فقط شامل اعداد باشد'),
    username: z
        .string()
        .min(1, 'نام کاربری الزامی است')
        .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
        .max(30, 'نام کاربری نباید بیشتر از ۳۰ کاراکتر باشد')
        .regex(
            /^(?!.*\.\.)(?!^\.)[a-zA-Z0-9._]{1,30}(?<!\.)$/,
            'نام کاربری فرمت معتبر ندارد'
        ),
    address: z
        .string()
        .min(1, 'آدرس الزامی است')
        .min(10, 'آدرس باید حداقل ۱۰ کاراکتر باشد')
        .max(80, 'آدرس نباید بیشتر از ۸۰ کاراکتر باشد'),
    addressShow: z.boolean(),
    bio: z.string().max(150, 'بایو نباید بیشتر از ۱۵۰ کاراکتر باشد').optional(),
});

export type profileSchemaType = z.infer<typeof profileSchema>;
