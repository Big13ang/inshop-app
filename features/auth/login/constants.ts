import { z } from 'zod/v4';

export const loginSchema = z.object({
    phone: z
        .string()
        .min(1, 'وارد کردن شماره تلفن همراه الزامی است.')
        .regex(/^(?:0?9|\+?989)\d{2}\W?\d{3}\W?\d{4}$/, 'شماره تلفن همراه معتبر نیست. (مثال: 09171234567)'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const TEXTS = {
    title: 'ورود / ثبت‌نام',
    subtitle: 'شماره تلفن همراه خود را وارد کنید.',
    label: 'شماره تلفن همراه',
    placeholder: '09171234567',
    submit: 'دریافت کد تایید',
    terms: 'با ورود، شرایط استفاده و سیاست حریم خصوصی را می‌پذیرید.',
    isSubmitting: 'در حال ارسال...',
};
