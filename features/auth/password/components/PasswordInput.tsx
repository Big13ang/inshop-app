import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ErrorMessage from '@/features/auth/login/components/ErrorMessage';
import { useFormContext } from 'react-hook-form';
import { passwordSchema, passwordValidationSchema } from '../../constant';

export default function PasswordInput() {
  const [hide, setHide] = useState(true);
  const { register, formState: { errors } } = useFormContext();

  const toggleHidePassword = () => setHide(prev => !prev);

  const errorMessage = errors.password?.message as string | undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor="password-input"
        className="text-xs font-semibold text-zinc-600 pr-1 cursor-pointer select-none"
      >
        رمز عبور
      </label>

      <div className="relative flex items-center">
        <span className="absolute right-4 text-zinc-400 pointer-events-none">
          <Lock className="w-4 h-4" />
        </span>

        <Input
          id="password-input"
          type={hide ? "password" : "text"}
          placeholder="••••••••"
          isError={!!errors.password}
          className="pr-11 pl-11 text-left font-sans"
          {...register('password')}
        />

        <button
          type="button"
          className="absolute left-3.5 text-zinc-400 hover:text-zinc-700 transition p-1 cursor-pointer rounded-lg focus:outline-none"
          tabIndex={-1}
          aria-label={hide ? "نمایش رمز عبور" : "مخفی کردن رمز عبور"}
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

