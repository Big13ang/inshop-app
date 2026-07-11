import { Input } from '@/components/ui/input';
import { convertPersianArabicToEnglish } from '@/lib/utils';
import { OTP_LENGTH } from '../hooks/otpLogic';

interface OtpInputGroupProps {
  slots: string[];
  inputRefs: React.RefObject<Array<HTMLInputElement | null>>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
}

export default function OtpInputGroup({
  slots,
  inputRefs,
  onChange,
  onKeyDown,
  onPaste,
}: OtpInputGroupProps) {
  return (
    <div className="flex justify-center gap-3" dir="ltr">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <Input
          key={i}
          id={`otp-input-${i}`}
          ref={(el) => {
            if (inputRefs.current) {
              inputRefs.current[i] = el;
            }
          }}
          type="text"
          inputMode="numeric"
          normalize={convertPersianArabicToEnglish}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          maxLength={1}
          value={slots[i]}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          className="w-14 h-16 text-center font-sans text-2xl font-bold shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        />
      ))}
    </div>
  );
}

