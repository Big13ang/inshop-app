export const TEXTS = {
    title: 'ورود / ثبت‌نام',
    subtitle: 'شماره تلفن همراه خود را وارد کنید.',
    label: 'شماره تلفن همراه',
    placeholder: '09171234567',
    submit: 'دریافت کد تایید',
    terms: 'با ورود، شرایط استفاده و سیاست حریم خصوصی را می‌پذیرید.',
    isSubmitting: 'در حال ارسال...',
    errorRequiredPhone: 'وارد کردن شماره تلفن همراه الزامی است.',
    errorInvalidPhone: 'شماره تلفن همراه معتبر نیست. (مثال: 09171234567)',
};

import { z } from 'zod/v4';

export const loginSchema = z.object({
    phone: z
        .string()
        .min(1, TEXTS.errorRequiredPhone)
        .regex(/^09\d{9}$/, TEXTS.errorInvalidPhone),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

