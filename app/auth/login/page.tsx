'use client';

import { LoginFormValues } from "@/features/auth/login/constants";
import Login from "@/features/auth/login/Login";
import { authClient } from "@/lib/auth-client";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSubmit = async (data: LoginFormValues): Promise<void> => {
        const { data: result, error } = await authClient.phoneNumber.sendOtp({
            phoneNumber: data.phone,
        });

        if (error) {
            toast.error(error.message || "خطا در ارسال کد تایید");
            return;
        }

        toast.success(result.message);

        router.push(`/auth/otp?phone=${encodeURIComponent(data.phone)}`);
    }

    return (
        <Login onSubmit={handleLoginSubmit} />
    );
}