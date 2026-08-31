'use client';


import { TEXTS } from '../constants';
import { Button } from '@/components/ui/button';
import { useCountdown } from '../hooks/useCountdown';
import { cn } from '@/lib/utils';

interface OtpTimerProps {
  onResend: () => void;
  resetOtp: () => void;
  initialTime?: number;
  className?: string;
}

export default function OtpTimer({ onResend, resetOtp, initialTime = 120, className }: OtpTimerProps) {
  const { timeLeft, isExpired, reset } = useCountdown({
    initialSeconds: initialTime,
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleResend = () => {
    onResend();
    resetOtp();
    reset();
  };

  return (
    <div className={cn("text-center mt-2", className)}>
      {!isExpired ? (
        <span className="text-xs text-zinc-500 font-medium flex items-center justify-center gap-1">
          <span>{TEXTS.resendPrefix}</span>
          <span className="font-mono font-semibold text-zinc-700 tracking-wider dir-ltr" dir="ltr">
            {formatTime(timeLeft)}
          </span>
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

