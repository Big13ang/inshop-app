'use client';

import { useState } from 'react';
import { LoginFormValues } from "@/features/auth/login/constants";
import Login from "@/features/auth/login/Login";
import SplashScreen from "@/features/auth/login/components/SplashScreen";
import { useAuthFlow } from "@/features/auth/hooks/useAuthFlow";

export default function LoginPage() {
    const [showSplash, setShowSplash] = useState(true);
    const { sendOtp, redirectToOtp } = useAuthFlow();

    const handleSplashComplete = () => {
        setShowSplash(false);
    };

    const handleLoginSubmit = async (data: LoginFormValues): Promise<void> => {
        const success = await sendOtp(data.phone);
        if (success) {
            redirectToOtp(data.phone);
        }
    };

    return (
        <>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <Login onSubmit={handleLoginSubmit} />
        </>
    );
}


