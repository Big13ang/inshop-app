import { useFormContext, useFormState } from 'react-hook-form';
import OtpInputGroup from '@/features/auth/otp/components/OtpInputGroup';
import ErrorMessage from '@/features/auth/login/components/ErrorMessage';
import { useOtp } from '@/features/auth/otp/hooks/useOtp';

export default function OtpInputSection() {
  const { setValue, control } = useFormContext();
  const { errors } = useFormState({ control });

  const handleOtpComplete = (code: string) => {
    setValue('otp', code, { shouldValidate: true });
  };

  const { slots, inputRefs, handleChange, handleKeyDown, handlePaste } = useOtp(handleOtpComplete);

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
    </div>
  );
}
