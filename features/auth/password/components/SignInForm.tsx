import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from '@/features/auth/login/components/PhoneInput';
import { AUTH_FORMS, AuthForm } from '../../constant';
import { AuthFormHeader } from './AuthFormHeader';
import { AuthFormActions } from './AuthFormActions';
import PasswordSection from './PasswordSection';
import PasswordInput from './PasswordInput';
import OtpInputSection from './OtpInputSection';
import { dynamicAuthValidationSchema, SignInFormData } from '../schemas/dynamicAuthSchema';
import {
  useSendPhoneNumberOTPMutation,
  useVerifyPhoneNumberMutation,
  useSignInPhoneNumberMutation,
  useRequestPasswordResetPhoneNumberMutation,
  useResetPasswordPhoneNumberMutation,
} from '@/features/auth/hooks/useAuthMutations';

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const callbackUrl = searchParams?.get ? searchParams.get('callbackUrl') : null;
  const destination = callbackUrl || '/app/profile';

  const sendOtpMutation = useSendPhoneNumberOTPMutation();
  const verifyMutation = useVerifyPhoneNumberMutation();
  const signInMutation = useSignInPhoneNumberMutation();
  const requestResetMutation = useRequestPasswordResetPhoneNumberMutation();
  const resetMutation = useResetPasswordPhoneNumberMutation();

  const formActions = useForm<SignInFormData>({
    mode: 'onChange',
    defaultValues: {
      phoneNumber: '',
      password: '',
      otp: '',
      authForm: AUTH_FORMS.SIGN_IN,
    },
    resolver: zodResolver(dynamicAuthValidationSchema),
  });

  const authForm = (useWatch({ control: formActions.control, name: 'authForm' }) as AuthForm) || AUTH_FORMS.SIGN_IN;

  const navigateToDestination = () => {
    if (typeof window !== 'undefined') {
      window.location.replace(destination);
    } else {
      startTransition(() => router.replace(destination));
    }
  };

  const setFormStep = (nextStep: AuthForm) => {
    formActions.setValue('authForm', nextStep, { shouldValidate: true });
  };

  const handleAuthSubmit = (data: SignInFormData) => {
    const { authForm: currentForm, phoneNumber, password = '', otp = '' } = data;

    switch (currentForm) {
      case AUTH_FORMS.SIGN_IN:
        signInMutation.mutate({ phoneNumber, password, rememberMe: true }, { onSuccess: navigateToDestination });
        break;

      case AUTH_FORMS.SIGN_UP_INIT:
        sendOtpMutation.mutate({ phoneNumber }, { onSuccess: () => setFormStep(AUTH_FORMS.SIGN_UP_FINALIZE) });
        break;

      case AUTH_FORMS.SIGN_UP_FINALIZE:
        verifyMutation.mutate({ phoneNumber, otp, newPassword: password }, { onSuccess: navigateToDestination });
        break;

      case AUTH_FORMS.FORGOT_PASS_INIT:
        requestResetMutation.mutate({ phoneNumber }, { onSuccess: () => setFormStep(AUTH_FORMS.FORGOT_PASS_FINALIZE) });
        break;

      case AUTH_FORMS.FORGOT_PASS_FINALIZE:
        resetMutation.mutate(
          { phoneNumber, otp, newPassword: password },
          {
            onSuccess: () => {
              // Sign in with the new password so a session cookie is set before navigating
              signInMutation.mutate({ phoneNumber, password, rememberMe: true }, { onSuccess: navigateToDestination });
            },
          }
        );
        break;
    }
  };

  const showOtpAndPassword =
    authForm === AUTH_FORMS.SIGN_UP_FINALIZE ||
    authForm === AUTH_FORMS.FORGOT_PASS_FINALIZE;

  const isLoading =
    signInMutation.isPending ||
    sendOtpMutation.isPending ||
    verifyMutation.isPending ||
    requestResetMutation.isPending ||
    resetMutation.isPending;

  return (
    <FormProvider {...formActions}>
      <form
        onSubmit={formActions.handleSubmit(handleAuthSubmit)}
        className="w-full max-w-sm mx-auto flex flex-col gap-5 font-sans text-right select-none"
      >
        <AuthFormHeader />

        {!showOtpAndPassword && (
          <PhoneInput placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="text-left" />
        )}

        {showOtpAndPassword && (
          <>
            <OtpInputSection />
            <PasswordInput />
          </>
        )}

        {authForm === AUTH_FORMS.SIGN_IN && <PasswordSection />}

        <AuthFormActions isLoading={isLoading} />
      </form>
    </FormProvider>
  );
}
