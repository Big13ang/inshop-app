import { authHttp } from '@/lib/utils';

export interface SendPhoneNumberOTPPayload {
  phoneNumber: string;
}

export interface SendPhoneNumberOTPResponse {
  message?: string;
}

export interface VerifyPhoneNumberPayload {
  phoneNumber: string;
  otp: string;
  newPassword: string;
}

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface VerifyPhoneNumberResponse {
  token?: string | null;
  user?: AuthUser;
  message?: string;
}

export interface SignInPhoneNumberPayload {
  phoneNumber: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignInPhoneNumberResponse {
  token?: string;
  user?: AuthUser;
  session?: unknown;
  message?: string;
}

export interface RequestPasswordResetPhoneNumberPayload {
  phoneNumber: string;
}

export interface RequestPasswordResetPhoneNumberResponse {
  status?: boolean;
  message?: string;
}

export interface ResetPasswordPhoneNumberPayload {
  phoneNumber: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordPhoneNumberResponse {
  status?: boolean;
  message?: string;
}

export async function sendPhoneNumberOTP(
  payload: SendPhoneNumberOTPPayload
) {
  return authHttp.post<SendPhoneNumberOTPResponse>('api/auth/phone-number/request-sign-up', payload);
}

export async function verifyPhoneNumber(
  payload: VerifyPhoneNumberPayload
) {
  return authHttp.post<VerifyPhoneNumberResponse>('api/auth/phone-number/sign-up', payload);
}

export async function signInPhoneNumber(
  payload: SignInPhoneNumberPayload
) {
  return authHttp.post<SignInPhoneNumberResponse>('api/auth/sign-in/phone-number', {
    rememberMe: true,
    ...payload,
  });
}

export async function requestPasswordResetPhoneNumber(
  payload: RequestPasswordResetPhoneNumberPayload
) {
  return authHttp.post<RequestPasswordResetPhoneNumberResponse>(
    'api/auth/phone-number/request-password-reset',
    payload
  );
}

export async function resetPasswordPhoneNumber(
  payload: ResetPasswordPhoneNumberPayload
): Promise<ResetPasswordPhoneNumberResponse> {
  return authHttp.post<ResetPasswordPhoneNumberResponse>(
    'api/auth/phone-number/reset-password',
    payload
  );
}

export async function signOut(): Promise<void> {
  return authHttp.post('api/auth/sign-out');
}
