'use client';

import Otp from '@/features/auth/otp/Otp';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';

interface OtpClientProps {
    phone: string;
}

export default function OtpClient({ phone }: OtpClientProps) {
    const { sendOtp, verifyOtp } = useAuthFlow();

    const handleResend = () => sendOtp(phone);

    const handleCompleteLogin = (code: string) => verifyOtp(code, phone);

    return (
        <Otp
            phone={phone}
            onResend={handleResend}
            onComplete={handleCompleteLogin}
        />
    );
}
