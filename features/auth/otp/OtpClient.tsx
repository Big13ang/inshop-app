'use client';

import Otp from '@/features/auth/otp/Otp';
import { useSendPhoneNumberOTPMutation } from '@/features/auth/hooks/useAuthMutations';

interface OtpClientProps {
  phone: string;
}

export default function OtpClient({ phone }: OtpClientProps) {
  const sendOtpMutation = useSendPhoneNumberOTPMutation();

  const handleResend = () => {
    sendOtpMutation.mutate({ phoneNumber: phone });
  };

  const handleCompleteLogin = (_code: string) => {
    // Handled via main sign up / OTP form
  };

  return (
    <Otp
      phone={phone}
      onResend={handleResend}
      onComplete={handleCompleteLogin}
    />
  );
}
