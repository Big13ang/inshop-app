import { Pencil } from 'lucide-react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import OtpInputGroup from '@/features/auth/otp/components/OtpInputGroup';
import OtpTimer from '@/features/auth/otp/components/OtpTimer';
import ErrorMessage from '@/features/auth/login/components/ErrorMessage';
import { useOtp } from '@/features/auth/otp/hooks/useOtp';
import PhoneNumberBadge from './PhoneNumberBadge';
import { AUTH_FORMS, AuthForm, PREVIOUS_STEP_MAP } from '../../constant';

interface OtpInputSectionProps {
  onResend?: () => void | Promise<void | boolean> | boolean;
  phoneNumber?: string;
}

export default function OtpInputSection({ onResend, phoneNumber: propPhone }: OtpInputSectionProps) {
  const formContext = useFormContext();
  const control = formContext?.control;
  const setValue = formContext?.setValue;

  const watchedPhone = useWatch({ control, name: 'phoneNumber' }) as string | undefined;
  const authForm = useWatch({ control, name: 'authForm' }) as AuthForm | undefined;
  const { errors } = useFormState({ control });

  const handleOtpComplete = (code: string) => {
    setValue?.('otp', code, { shouldValidate: true });
  };

  const { slots, inputRefs, handleChange, handleKeyDown, handlePaste, reset } = useOtp(handleOtpComplete);

  const handleResetOtp = () => {
    reset();
    setValue?.('otp', '', { shouldValidate: true });
  };

  const handleOtpSlotChange = (index: number, value: string) => {
    handleChange(index, value);
    const nextSlots = [...slots];
    nextSlots[index] = value;
    setValue?.('otp', nextSlots.join(''), { shouldValidate: true });
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    handlePaste(e);
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    setValue?.('otp', pasted, { shouldValidate: true });
  };

  const activePhoneNumber = propPhone || watchedPhone;

  const handleEditPhone = () => {
    if (authForm) {
      const targetStep = PREVIOUS_STEP_MAP[authForm] ?? AUTH_FORMS.FORGOT_PASS_INIT;
      setValue?.('authForm', targetStep, { shouldValidate: true });
    }
  };

  const showEditPhoneButton = Boolean(authForm);

  const errorMessage = errors.otp?.message as string | undefined;

  return (
    <div className="w-[260px] max-w-full mx-auto flex flex-col gap-2.5">
      {activePhoneNumber ? (
        <PhoneNumberBadge phoneNumberBadge={activePhoneNumber} />
      ) : (
        <label className="text-xs font-semibold text-zinc-600 block text-right pr-0.5 w-full">
          کد تأیید ۴ رقمی را وارد کنید
        </label>
      )}

      <OtpInputGroup
        slots={slots}
        inputRefs={inputRefs}
        onChange={handleOtpSlotChange}
        onKeyDown={handleKeyDown}
        onPaste={handleOtpPaste}
      />

      {errorMessage && <ErrorMessage message={errorMessage} />}

      <div className="flex items-center justify-between w-full text-xs mt-0.5">
        <OtpTimer onResend={onResend} resetOtp={handleResetOtp} initialTime={120} className="mt-0" />

        {showEditPhoneButton && (
          <button
            type="button"
            onClick={handleEditPhone}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer flex items-center gap-1 shrink-0 hover:underline underline-offset-4"
            aria-label="تغییر شماره"
          >
            <Pencil className="w-3 h-3 text-zinc-400" />
            <span>تغییر شماره</span>
          </button>
        )}
      </div>
    </div>
  );
}