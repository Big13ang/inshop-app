'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { tryCatchAuth } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

interface UseAuthFlowOptions {
  onSuccessRedirect?: string;
}

export function useAuthFlow(options: UseAuthFlowOptions = {}) {
  const router = useRouter();
  const { onSuccessRedirect = '/app/posts/new' } = options;

  const sendOtp = async (phoneNumber: string): Promise<boolean> => {
    const { data, error } = await tryCatchAuth(
      authClient.phoneNumber.sendOtp({ phoneNumber }),
      ERROR_MESSAGES.auth.sendOtpFailed
    );

    if (error) {
      return false;
    }

    if (data.data?.message) {
      toast.success(data.data.message);
    }
    return true;
  };

  const verifyOtp = async (code: string, phoneNumber: string): Promise<boolean> => {
    const { error } = await tryCatchAuth(
      authClient.phoneNumber.verify({ code, phoneNumber }),
      ERROR_MESSAGES.auth.verifyOtpFailed
    );

    if (error) {
      return false;
    }

    router.push(onSuccessRedirect);
    return true;
  };

  const redirectToOtp = (phoneNumber: string) => {
    router.push(`/auth/otp?phone=${encodeURIComponent(phoneNumber)}`);
  };

  const signOut = async (): Promise<boolean> => {
    const { error } = await tryCatchAuth(
      authClient.signOut(),
      ERROR_MESSAGES.auth.signOutFailed
    );

    return !error;
  };

  return {
    sendOtp,
    verifyOtp,
    redirectToOtp,
    signOut,
  };
}
