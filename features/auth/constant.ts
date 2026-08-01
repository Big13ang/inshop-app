import z from "zod";

export const AUTH_FORMS = {
    SIGN_IN: "SIGN_IN",
    SIGN_UP_INIT: "SIGN_UP_INIT",
    SIGN_UP_FINALIZE: "SIGN_UP_FINALIZE",
    FORGOT_PASS_INIT: "FORGOT_PASS_INIT",
    FORGOT_PASS_FINALIZE: "FORGOT_PASS_FINALIZE",
} as const;

export type AuthForm = (typeof AUTH_FORMS)[keyof typeof AUTH_FORMS];

export const AUTH_FORM_HEADERS: Record<AuthForm, { title: string; subTitle: string }> = {
    [AUTH_FORMS.SIGN_IN]: {
        title: "ورود با رمز عبور",
        subTitle: "شماره همراه و رمز عبور حساب خود را وارد نمایید.",
    },
    [AUTH_FORMS.SIGN_UP_INIT]: {
        title: "ثبت‌نام حساب جدید",
        subTitle: "لطفاً شماره همراه خود را برای دریافت کد تأیید وارد کنید.",
    },
    [AUTH_FORMS.SIGN_UP_FINALIZE]: {
        title: "تکمیل ثبت‌نام و رمز عبور",
        subTitle: "کد تأیید ارسال‌شده و رمز عبور جدید خود را وارد نمایید.",
    },
    [AUTH_FORMS.FORGOT_PASS_INIT]: {
        title: "بازیابی رمز عبور",
        subTitle: "شماره همراه خود را جهت دریافت کد بازیابی وارد نمایید.",
    },
    [AUTH_FORMS.FORGOT_PASS_FINALIZE]: {
        title: "تنظیم رمز عبور جدید",
        subTitle: "برای امنیت حساب خود، یک رمز عبور جدید تعیین کنید.",
    },
} as const;

export const AUTH_FORM_CONFIG: Record<AuthForm, {
    submitText: string;
    secondaryAction?: {
        text: string;
        targetForm: AuthForm;
    };
    showForgotPassword?: boolean;
}> = {
    [AUTH_FORMS.SIGN_IN]: {
        submitText: "ورود به حساب کاربری",
        showForgotPassword: true,
        secondaryAction: {
            text: "ثبت‌نام",
            targetForm: AUTH_FORMS.SIGN_UP_INIT,
        },
    },
    [AUTH_FORMS.SIGN_UP_INIT]: {
        submitText: "دریافت کد تأیید",
        secondaryAction: {
            text: "ورود با رمز عبور",
            targetForm: AUTH_FORMS.SIGN_IN,
        },
    },
    [AUTH_FORMS.SIGN_UP_FINALIZE]: {
        submitText: "ثبت‌نام و ورود به حساب",
    },
    [AUTH_FORMS.FORGOT_PASS_INIT]: {
        submitText: "دریافت کد بازیابی",
        secondaryAction: {
            text: "ورود با رمز عبور",
            targetForm: AUTH_FORMS.SIGN_IN,
        },
    },
    [AUTH_FORMS.FORGOT_PASS_FINALIZE]: {
        submitText: "ثبت رمز عبور جدید",
    },
} as const;



export const PREVIOUS_STEP_MAP: Partial<Record<AuthForm, AuthForm>> = {
    [AUTH_FORMS.SIGN_UP_FINALIZE]: AUTH_FORMS.SIGN_UP_INIT,
    [AUTH_FORMS.FORGOT_PASS_FINALIZE]: AUTH_FORMS.FORGOT_PASS_INIT,
};

export const passwordSchema = z.string()
    .trim()
    .min(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' })
    .max(12, { message: 'رمز عبور می‌تواند حداکثر ۱۲ کاراکتر باشد.' })
    .regex(/[a-zA-Z]/, { message: 'رمز عبور باید شامل حداقل یک حرف انگلیسی باشد.' })
    .regex(/[0-9]/, { message: 'رمز عبور باید شامل حداقل یک عدد باشد.' })
    .regex(/^\S+$/, { message: 'رمز عبور نباید شامل فاصله باشد.' })
    .regex(/^[\x21-\x7E]+$/, { message: 'رمز عبور تنها می‌تواند شامل حروف انگلیسی، اعداد و علائم باشد.' });

export const passwordValidationSchema = z.object({
    password: passwordSchema,
});

export const phoneNumberSchema = z.object({
    phoneNumber: z.string()
        .length(11, { message: 'شماره همراه باید 11 رقم باشد.' })
        .regex(/^09\d{9}$/, { message: "شماره وارد شده نامعتبر است." }),
});

export type PhoneFormValues = z.infer<typeof phoneNumberSchema>;

// Form 1: Sign In (Phone + Strictly Required Password)
export const signInValidationSchema = phoneNumberSchema.extend({
    password: passwordSchema,
    authForm: z.enum(AUTH_FORMS),
});

// Form 2: Initial Step (Strictly Phone Only)
export const phoneOnlyValidationSchema = phoneNumberSchema.extend({
    authForm: z.enum(AUTH_FORMS),
});

// Form 3: Set / Reset Password Step (Strictly Password + Confirm Password)
export const setPasswordValidationSchema = z.object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
    authForm: z.enum(AUTH_FORMS),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند.',
    path: ['confirmPassword'],
});

export const phoneNumberValidationSchema = signInValidationSchema;




