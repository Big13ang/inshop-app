import { useRef, useState } from 'react';
import { OTP_LENGTH, extractDigits, fillSlots, areAllOtpSlotsFilled, setSlot } from './otpLogic';

const fillEmpty = () => Array(OTP_LENGTH).fill('');

export function useOtp(onComplete: (code: string) => void) {
  const [slots, setSlots] = useState<string[]>(() => fillEmpty());
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      handleFill(value);
      return;
    }

    const digit = extractDigits(value);
    const next = setSlot(slots, index, digit);
    setSlots(next);

    if (digit) {
      focusAt(index + 1);
      if (areAllOtpSlotsFilled(next)) onComplete(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !slots[index]) {
      focusAt(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    handleFill(e.clipboardData.getData('text'));
  };

  const handleFill = (raw: string) => {
    const digits = extractDigits(raw);
    if (!digits) return;

    const next = fillSlots(digits);
    setSlots(next);
    focusAt(digits.length - 1);
    if (areAllOtpSlotsFilled(next)) onComplete(next.join(''));
  };

  const reset = () => {
    setSlots(fillEmpty());
    focusAt(0);
  };

  return { slots, inputRefs, handleChange, handleKeyDown, handlePaste, reset };
}
