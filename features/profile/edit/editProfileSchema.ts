import { z } from 'zod';

export const profileSchema = z.object({
    shopName: z.string().min(1, 'نام فروشگاه الزامی است'),
    shopPhoneNumber: z.string().length(11, 'شماره تلفن فروشگاه الزامی است'),
    username: z.string().min(1, 'نام کاربری الزامی است'),
    address: z.string().min(10, 'آدرس الزامی است').max(80, 'آدرس نباید بیشتر از ۸۰ کاراکتر باشد'),
    addressShow: z.boolean(),
    bio: z.string().max(150, 'بایو نباید بیشتر از ۱۵۰ کاراکتر باشد'),
});

export type profileSchemaType = z.infer<typeof profileSchema>;
