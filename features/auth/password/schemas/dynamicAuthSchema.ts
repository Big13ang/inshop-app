import z from 'zod';
import { AUTH_FORMS, passwordSchema, phoneNumberSchema } from '../../constant';

export const dynamicAuthValidationSchema = z.object({
  phoneNumber: phoneNumberSchema.shape.phoneNumber,
  password: z.string().optional(),
  otp: z.string().optional(),
  authForm: z.string(),
}).superRefine((data, ctx) => {
  if (data.authForm === AUTH_FORMS.SIGN_IN) {
    const result = passwordSchema.safeParse(data.password);
    if (!result.success) {
      result.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: ['password'] }));
    }
  } else if (
    data.authForm === AUTH_FORMS.SIGN_UP_FINALIZE ||
    data.authForm === AUTH_FORMS.FORGOT_PASS_FINALIZE
  ) {
    const passResult = passwordSchema.safeParse(data.password);
    if (!passResult.success) {
      passResult.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: ['password'] }));
    }
    if (!data.otp || data.otp.length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'کد تأیید ۴ رقمی را وارد نمایید.',
        path: ['otp'],
      });
    }
  }
});

export type SignInFormData = z.infer<typeof dynamicAuthValidationSchema>;
