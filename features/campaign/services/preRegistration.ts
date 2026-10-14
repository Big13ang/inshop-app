import { HTTPError } from 'ky';
import { http, type ApiResponse } from '@/lib/utils';

/** Mirrors `CreatePreRegistrationDto` in inshop-back-end/src/pre-register/dto. */
export type PreRegistrationRequest = {
  name: string;
  lastName: string;
  phoneNumber: string;
  nationalIdNumber: string;
  province: string;
  city: string;
  instagramId: string;
  followersCount: string;
  productCategory: string;
  businessType: string;
  bio: string;
};

/** Return value of `PreRegisterService.create`; `message` is an untranslated i18n key. */
export type PreRegistrationResponse = {
  message: string;
  status: 'pending';
};

export const submitPreRegistration = async (
  body: PreRegistrationRequest
): Promise<PreRegistrationResponse> => {
  const response = await http.post<ApiResponse<PreRegistrationResponse>>('/pre-register', body);
  return response.data;
};

export const getPreRegistrationErrorMessage = (error: unknown): string => {
  if (error instanceof HTTPError) {
    if (error.response.status === 409) {
      return 'کاربری با این کد ملی یا شماره موبایل قبلاً ثبت‌نام کرده است.';
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof TypeError) {
    return 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.';
  }

  return 'هنگام ارسال پیش‌ثبت‌نام مشکلی پیش آمد. لطفاً دوباره تلاش کنید.';
};
