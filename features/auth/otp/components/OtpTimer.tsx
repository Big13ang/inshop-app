'use client';

import { useState, useEffect } from 'react';
import { TEXTS } from '../constants';
import { Button } from '@/components/ui/button';

interface OtpTimerProps {
  onResend?: () => void | Promise<void | boolean> | boolean;
  resetOtp: () => void;
  initialTime?: number;
}

export default function OtpTimer({ onResend, resetOtp, initialTime = 120 }: OtpTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Fix 9: sync state when the prop changes (e.g. parent updates resend window duration)
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  const isTimerActive = timeLeft > 0;

  useEffect(() => {
    if (!isTimerActive) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerActive]);

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
    setTimeLeft(initialTime);
  };

  return (
    <div className="text-center mt-4">
      {timeLeft > 0 ? (
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
