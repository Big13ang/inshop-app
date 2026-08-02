import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { phoneNumberSchema as phoneSchema, PhoneFormValues } from '../../constant';
import PhoneInput from '@/features/auth/login/components/PhoneInput';
import { Button } from '@/components/ui/button';

export interface PhoneEntryFormProps {
  title: string;
  subtitle: string;
  onSubmit: (phone: string) => void | Promise<void>;
  onBackToSignIn?: () => void;
  isLoading?: boolean;
}

export default function PhoneEntryForm({
  title,
  subtitle,
  onSubmit,
  onBackToSignIn,
  isLoading = false,
}: PhoneEntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: PhoneFormValues) => {
    await onSubmit(data.phoneNumber);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="w-full max-w-sm mx-auto flex flex-col gap-6 font-sans text-right select-none"
    >
      <div className="text-center">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>

      <PhoneInput
        id="phone-entry-input"
        type="tel"
        inputMode="numeric"
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        label="شماره همراه"
        isError={!!errors.phoneNumber}
        error={errors.phoneNumber?.message}
        disabled={isLoading}
        {...register('phoneNumber')}
      />

      <Button
        type="submit"
        variant="filled"
        size="xl"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>در حال ارسال کد...</span>
          </>
        ) : (
          <>
            <span>دریافت کد تأیید</span>
            <ArrowLeft className="w-4 h-4" />
          </>
        )}
      </Button>

      {onBackToSignIn ? (
        <div className="text-center mt-1">
          <button
            type="button"
            onClick={onBackToSignIn}
            className="text-xs text-zinc-500 hover:text-zinc-950 font-medium transition cursor-pointer"
          >
            ورود با رمز عبور
          </button>
        </div>
      ) : null}
    </form>
  );
}
