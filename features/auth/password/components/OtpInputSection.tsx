import { useFormContext, useFormState } from 'react-hook-form';
import OtpInputGroup from '@/features/auth/otp/components/OtpInputGroup';
import OtpTimer from '@/features/auth/otp/components/OtpTimer';
import ErrorMessage from '@/features/auth/login/components/ErrorMessage';
import { useOtp } from '@/features/auth/otp/hooks/useOtp';

interface OtpInputSectionProps {
  onResend?: () => void | Promise<void | boolean> | boolean;
}

export default function OtpInputSection({ onResend }: OtpInputSectionProps) {
  const { setValue, control } = useFormContext();
  const { errors } = useFormState({ control });

  const handleOtpComplete = (code: string) => {
    setValue('otp', code, { shouldValidate: true });
  };

  const { slots, inputRefs, handleChange, handleKeyDown, handlePaste, reset } = useOtp(handleOtpComplete);

  const handleResetOtp = () => {
    reset();
    setValue('otp', '', { shouldValidate: true });
  };

  const handleOtpSlotChange = (index: number, value: string) => {
    handleChange(index, value);
    const nextSlots = [...slots];
    nextSlots[index] = value;
    setValue('otp', nextSlots.join(''), { shouldValidate: true });
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    handlePaste(e);
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    setValue('otp', pasted, { shouldValidate: true });
  };

  const errorMessage = errors.otp?.message as string | undefined;

  return (
    <div className="flex flex-col gap-1.5 items-center w-full">
      <label className="text-xs font-semibold text-zinc-600 self-start pr-1">
        کد تأیید ۴ رقمی
      </label>
      <OtpInputGroup
        slots={slots}
        inputRefs={inputRefs}
        onChange={handleOtpSlotChange}
        onKeyDown={handleKeyDown}
        onPaste={handleOtpPaste}
      />
      {errorMessage && <ErrorMessage message={errorMessage} />}
      <OtpTimer onResend={onResend} resetOtp={handleResetOtp} initialTime={120} />
    </div>
  );
}
