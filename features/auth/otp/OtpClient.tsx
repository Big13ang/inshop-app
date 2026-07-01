'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Otp from '@/features/auth/otp/Otp';
import { authClient } from '@/lib/auth-client';

interface OtpClientProps {
    phone: string;
}

export default function OtpClient({ phone }: OtpClientProps) {
    const router = useRouter();

    const handleResend = async () => {
        const { data, error } = await authClient.phoneNumber.sendOtp({
            phoneNumber: phone,
        });

        if (error) {
            toast.error(error.message);
            return false;
        }

        toast.success(data.message);
        return true;
    };

    const handleCompleteLogin = async (code: string) => {
        const { error } = await authClient.phoneNumber.verify({
            code: code,
            phoneNumber: phone,
        });

        if (error) {
            return toast.error(error.message);
        }

        return router.push('/app/posts/new');
    };

    return (
        <Otp
            phone={phone}
            onResend={handleResend}
            onComplete={handleCompleteLogin}
        />
    );
}
