'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCountdownOptions {
  initialSeconds: number;
  onComplete?: () => void;
}

interface UseCountdownReturn {
  timeLeft: number;
  isExpired: boolean;
  reset: (newSeconds?: number) => void;
}

export function useCountdown({
  initialSeconds,
  onComplete,
}: UseCountdownOptions): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  const isExpired = timeLeft <= 0;

  const reset = useCallback((newSeconds?: number) => {
    setTimeLeft(newSeconds ?? initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isExpired) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExpired, onComplete]);

  return { timeLeft, isExpired, reset };
}
