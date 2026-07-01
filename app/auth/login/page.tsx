'use client';

import { LoginFormValues } from "@/features/auth/login/constants";
import Login from "@/features/auth/login/Login";
import { useAuthFlow } from "@/features/auth/hooks/useAuthFlow";

export default function LoginPage() {
    const { sendOtp, redirectToOtp } = useAuthFlow();

    const handleLoginSubmit = async (data: LoginFormValues): Promise<void> => {
        const success = await sendOtp(data.phone);
        if (success) {
            redirectToOtp(data.phone);
        }
    };

    return <Login onSubmit={handleLoginSubmit} />;
}
