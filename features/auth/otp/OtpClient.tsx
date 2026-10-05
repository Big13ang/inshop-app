'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Otp from '@/features/auth/otp/Otp';
import { useSendPhoneNumberOTPMutation } from '@/features/auth/hooks/useAuthMutations';

export function OtpClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone');

  useEffect(() => {
    if (!phone) {
      router.replace('/auth/login');
    }
  }, [phone, router]);

  const sendOtpMutation = useSendPhoneNumberOTPMutation();

  const handleResend = () => {
    if (phone) {
      sendOtpMutation.mutate({ phoneNumber: phone });
    }
  };

  const handleCompleteLogin = (_code: string) => {
    // Handled via main sign up / OTP form
  };

  if (!phone) {
    return null;
  }

  return (
    <Otp
      phone={phone}
      onResend={handleResend}
      onComplete={handleCompleteLogin}
    />
  );
}
