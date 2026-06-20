import { useRef, useState } from 'react';
import { OTP_LENGTH, extractDigits, fillSlots, areAllOtpSlotsFilled, setSlot } from './otpLogic';

const fillEmpty = () => Array(OTP_LENGTH).fill('');

export function useOtp(onComplete: (code: string) => void) {
  const [slots, setSlots] = useState<string[]>(() => fillEmpty());
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  // Fix 4: mirror slots in a ref so handlers always read the latest value, not a stale closure snapshot
  const slotsRef = useRef<string[]>(fillEmpty());
  // Fix 6: keep onComplete in a ref so memoized handlers always invoke the latest callback
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  };

  const updateSlots = (next: string[]) => {
    slotsRef.current = next;
    setSlots(next);
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      handleFill(value);
      return;
    }

    const digit = extractDigits(value);
    const next = setSlot(slotsRef.current, index, digit);
    updateSlots(next);

    if (digit) {
      focusAt(index + 1);
      if (areAllOtpSlotsFilled(next)) onCompleteRef.current(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !slotsRef.current[index]) {
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
    updateSlots(next);
    // Fix 8: focus the slot AFTER the last pasted digit, not the last filled slot
    focusAt(digits.length);
    if (areAllOtpSlotsFilled(next)) onCompleteRef.current(next.join(''));
  };

  const reset = () => {
    updateSlots(fillEmpty());
    focusAt(0);
  };

  return { slots, inputRefs, handleChange, handleKeyDown, handlePaste, reset };
}
