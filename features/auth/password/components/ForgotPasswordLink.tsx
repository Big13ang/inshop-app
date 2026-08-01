import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { AUTH_FORMS, AuthForm } from '../../constant';

export default function ForgotPasswordLink() {
  const { setValue } = useFormContext();
  const authForm = useWatch({ name: 'authForm' }) as AuthForm;

  if (authForm !== AUTH_FORMS.SIGN_IN) return null;

  const handleForgotPasswordClick = () => {
    setValue('authForm', AUTH_FORMS.FORGOT_PASS_INIT, { shouldValidate: true });
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
}
