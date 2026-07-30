import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import PasswordInput from './PasswordInput';
import { Button } from '@/components/ui/button';
import PhoneInput from '@/features/auth/login/components/PhoneInput';
import { zodResolver } from '@hookform/resolvers/zod';
import { AUTH_FORMS, AuthForm, signInValidationSchema } from '../../constant';
import { AuthFormHeader } from './AuthFormHeader';
import { AuthFormActions } from './AuthFormActions';

const ForgotPasswordLink = () => {
  const { watch, setValue } = useFormContext();
  const authForm = watch('authFrom') as AuthForm;

  if (authForm !== AUTH_FORMS.SIGN_IN) return null;

  const handleForgotPasswordClick = () => {
    setValue('authFrom', AUTH_FORMS.FORGOT_PASS_INIT);
  };

  return (
    <div className="flex items-center justify-between text-xs mt-1 px-1">
      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={handleForgotPasswordClick}
      >
        فراموشی رمز عبور؟
      </Button>
    </div>
  );
};

export default function SignInForm() {
  const formActions = useForm({
    mode: 'onChange',
    defaultValues: {
      phoneNumber: '',
      password: '',
      authFrom: AUTH_FORMS.SIGN_IN,
    },
    resolver: zodResolver(signInValidationSchema)
  });

  return (
    <FormProvider {...formActions}>
      <form className="w-full max-w-sm mx-auto flex flex-col gap-5 font-sans text-right select-none">
        <AuthFormHeader />
        <PhoneInput placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="text-left" />

        <div className="flex flex-col gap-1.5">
          <PasswordInput />
          <ForgotPasswordLink />
        </div>

        <AuthFormActions />
      </form>
    </FormProvider>
  );
}


