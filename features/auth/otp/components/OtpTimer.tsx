'use client';


import { TEXTS } from '../constants';
import { Button } from '@/components/ui/button';
import { useCountdown } from '../hooks/useCountdown';

interface OtpTimerProps {
  onResend?: () => void | Promise<void | boolean> | boolean;
  resetOtp: () => void;
  initialTime?: number;
}

export default function OtpTimer({ onResend, resetOtp, initialTime = 120 }: OtpTimerProps) {
  const { timeLeft, isExpired, reset } = useCountdown({
    initialSeconds: initialTime,
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleResend = async () => {
    if (onResend) {
      const result = await onResend();
      if (result === false) return;
    }
    resetOtp();
    reset();
  };

  return (
    <div className="text-center mt-4">
      {!isExpired ? (
        <span className="text-xs text-zinc-500 cursor-pointer">
          {TEXTS.resendPrefix}
          {formatTime(timeLeft)}
        </span>
      ) : (
        <Button
          type="button"
          variant="link"
          onClick={handleResend}
          className="h-auto p-0 text-xs text-zinc-950 font-bold hover:underline cursor-pointer"
        >
          {TEXTS.resendActive}
        </Button>
      )}
    </div>
  );
}
