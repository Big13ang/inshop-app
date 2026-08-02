'use client';

import { useState } from 'react';
import SplashScreen from "@/features/auth/login/components/SplashScreen";
import PasswordAuthContainer from "@/features/auth/password/PasswordAuthContainer";

export default function LoginPage() {
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = () => {
        setShowSplash(false);
    };

    return (
        <>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <PasswordAuthContainer />
        </>
    );
}
