import { useWatch } from 'react-hook-form';
import PasswordInput from './PasswordInput';
import ForgotPasswordLink from './ForgotPasswordLink';
import { AUTH_FORMS, AuthForm } from '../../constant';

export default function PasswordSection() {
  const authForm = useWatch({ name: 'authForm' }) as AuthForm;

  if (authForm !== AUTH_FORMS.SIGN_IN) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <PasswordInput />
      <ForgotPasswordLink />
    </div>
  );
}
