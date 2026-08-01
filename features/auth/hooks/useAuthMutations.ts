import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys, queryCacheFactory } from '@/lib/query-keys';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import {
  sendPhoneNumberOTP,
  verifyPhoneNumber,
  signInPhoneNumber,
  requestPasswordResetPhoneNumber,
  resetPasswordPhoneNumber,
  signOut,
  SendPhoneNumberOTPPayload,
  VerifyPhoneNumberPayload,
  SignInPhoneNumberPayload,
  RequestPasswordResetPhoneNumberPayload,
  ResetPasswordPhoneNumberPayload,
} from '@/features/auth/services/authService';

export function useSendPhoneNumberOTPMutation() {
  return useMutation({
    mutationFn: (payload: SendPhoneNumberOTPPayload) => sendPhoneNumberOTP(payload),
    onSuccess: (data) => {
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      if (error?.message) {
        toast.error(error.message);
      }
    },
  });
}

export function useVerifyPhoneNumberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyPhoneNumberPayload) => verifyPhoneNumber(payload),
    onSuccess: (data) => {
      queryCacheFactory.profile.invalidateMe(queryClient);
      queryCacheFactory.auth.invalidateSession(queryClient);
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      if (error?.message) {
        toast.error(error.message);
      }
    },
  });
}

export function useSignInPhoneNumberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignInPhoneNumberPayload) => signInPhoneNumber(payload),
    onSuccess: (data) => {
      queryCacheFactory.profile.invalidateMe(queryClient);
      queryCacheFactory.auth.invalidateSession(queryClient);
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      if (error?.message) {
        toast.error(error.message);
      }
    },
  });
}

export function useRequestPasswordResetPhoneNumberMutation() {
  return useMutation({
    mutationFn: (payload: RequestPasswordResetPhoneNumberPayload) =>
      requestPasswordResetPhoneNumber(payload),
    onSuccess: (data) => {
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      if (error?.message) {
        toast.error(error.message);
      }
    },
  });
}

export function useResetPasswordPhoneNumberMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPhoneNumberPayload) =>
      resetPasswordPhoneNumber(payload),
    onSuccess: (data) => {
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (error: Error) => {
      if (error?.message) {
        toast.error(error.message);
      }
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile.me, null);
      queryCacheFactory.profile.invalidateMe(queryClient);
    },
    onError: () => {
      toast.error(ERROR_MESSAGES.auth.signOutFailed);
    },
  });
}
