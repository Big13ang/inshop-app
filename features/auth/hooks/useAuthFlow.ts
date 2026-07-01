'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import type { SendOtpResponse, AuthClientResult } from '../types';

interface UseAuthFlowOptions {
  onSuccessRedirect?: string;
}

export function useAuthFlow(options: UseAuthFlowOptions = {}) {
  const router = useRouter();
  const { onSuccessRedirect = '/app/posts/new' } = options;

  const sendOtp = async (phoneNumber: string): Promise<boolean> => {
    const { data, error } = await authClient.phoneNumber.sendOtp({
      phoneNumber,
    });

    if (error) {
      toast.error(error.message || 'خطا در ارسال کد تایید');
      return false;
    }

    toast.success(data.message);
    return true;
  };

  const verifyOtp = async (code: string, phoneNumber: string): Promise<boolean> => {
    const { error } = await authClient.phoneNumber.verify({
      code,
      phoneNumber,
    });

    if (error) {
      toast.error(error.message);
      return false;
    }

    router.push(onSuccessRedirect);
    return true;
  };

  const redirectToOtp = (phoneNumber: string) => {
    router.push(`/auth/otp?phone=${encodeURIComponent(phoneNumber)}`);
  };

  return {
    sendOtp,
    verifyOtp,
    redirectToOtp,
  };
}
