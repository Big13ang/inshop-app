'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { tryCatchAuth } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { queryKeys, queryCacheFactory } from '@/lib/query-keys';
import { debugAuth } from '@/lib/utils/authDebug';

interface UseAuthFlowOptions {
  onSuccessRedirect?: string;
}

export function useAuthFlow(options: UseAuthFlowOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { onSuccessRedirect = '/app/posts/new' } = options;

  const sendOtp = async (phoneNumber: string): Promise<boolean> => {
    debugAuth('auth-flow', 'sendOtp:start', { phoneNumber });

    const { data, error } = await tryCatchAuth(
      authClient.phoneNumber.sendOtp({ phoneNumber }),
      ERROR_MESSAGES.auth.sendOtpFailed
    );

    if (error) {
      debugAuth('auth-flow', 'sendOtp:error', {
        phoneNumber,
        errorMessage: error.message,
      });
      return false;
    }

    debugAuth('auth-flow', 'sendOtp:success', {
      phoneNumber,
      hasMessage: !!data.data?.message,
    });

    if (data.data?.message) {
      toast.success(data.data.message);
    }
    return true;
  };

  const verifyOtp = async (code: string, phoneNumber: string): Promise<boolean> => {
    debugAuth('auth-flow', 'verifyOtp:start', {
      phoneNumber,
      codeLength: code.length,
    });

    const { error } = await tryCatchAuth(
      authClient.phoneNumber.verify({ code, phoneNumber }),
      ERROR_MESSAGES.auth.verifyOtpFailed
    );

    if (error) {
      debugAuth('auth-flow', 'verifyOtp:error', {
        phoneNumber,
        errorMessage: error.message,
      });
      return false;
    }

    // Invalidate profile query to fetch immediately
    debugAuth('auth-flow', 'verifyOtp:invalidateProfile', {
      queryKey: queryKeys.profile.me.join('.'),
    });
    queryCacheFactory.profile.invalidateMe(queryClient);

    debugAuth('auth-flow', 'verifyOtp:redirect', {
      destination: onSuccessRedirect,
    });
    router.push(onSuccessRedirect);
    return true;
  };

  const redirectToOtp = (phoneNumber: string) => {
    const destination = `/auth/otp?phone=${encodeURIComponent(phoneNumber)}`;
    debugAuth('auth-flow', 'redirectToOtp', { phoneNumber, destination });
    router.push(destination);
  };

  const signOut = async (): Promise<boolean> => {
    debugAuth('auth-flow', 'signOut:start');

    const { error } = await tryCatchAuth(
      authClient.signOut(),
      ERROR_MESSAGES.auth.signOutFailed
    );

    if (!error) {
      debugAuth('auth-flow', 'signOut:clearProfileCache', {
        queryKey: queryKeys.profile.me.join('.'),
      });
      // Clear profile query cache and invalidate
      queryClient.setQueryData(queryKeys.profile.me, null);
      queryCacheFactory.profile.invalidateMe(queryClient);
    } else {
      debugAuth('auth-flow', 'signOut:error', {
        errorMessage: error.message,
      });
    }

    return !error;
  };

  return {
    sendOtp,
    verifyOtp,
    redirectToOtp,
    signOut,
  };
}
