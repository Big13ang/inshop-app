import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ErrorMessage from '@/features/auth/login/components/ErrorMessage';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { AUTH_FORMS, AuthForm } from '../../constant';

export default function PasswordInput() {
  const [hide, setHide] = useState(true);
  const { register, control } = useFormContext();
  const { errors } = useFormState({ control });
  const authForm = useWatch({ control, name: 'authForm' }) as AuthForm;

  const isNewPasswordStep =
    authForm === AUTH_FORMS.SIGN_UP_FINALIZE ||
    authForm === AUTH_FORMS.FORGOT_PASS_FINALIZE;

  const displayLabel = isNewPasswordStep ? "رمز عبور جدید" : "رمز عبور";

  const toggleHidePassword = () => setHide(prev => !prev);

  const errorMessage = errors.password?.message as string | undefined;
  const isError = !!errorMessage;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor="password-input"
        className="text-xs font-semibold text-zinc-600 pr-1 cursor-pointer select-none"
      >
        {displayLabel}
      </label>

      <div className="relative flex items-center">
        <span className="absolute right-4 text-zinc-400 pointer-events-none">
          <Lock className="w-4 h-4" />
        </span>

        <Input
          id="password-input"
          type={hide ? "password" : "text"}
          placeholder="••••••••"
          isError={isError}
          className="pr-11 pl-11 text-left font-sans"
          {...register('password')}
        />

        <button
          type="button"
          className="absolute left-3.5 text-zinc-400 hover:text-zinc-700 transition p-1 cursor-pointer rounded-lg focus:outline-none"
          tabIndex={-1}
          aria-label={hide ? `نمایش ${displayLabel}` : `مخفی کردن ${displayLabel}`}
          onClick={toggleHidePassword}
        >
          {hide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {errorMessage && (
        <ErrorMessage message={errorMessage} />
      )}
    </div>
  );
}

