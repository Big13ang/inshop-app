import type { BeforeErrorState, Options } from 'ky';
import { Result } from './result';

export function getBaseUrl(overrideUrl?: string): string {
  const url = overrideUrl || process.env.NEXT_PUBLIC_API_URL;
  return url ? url.replace(/\/$/, '') : '';
}

export function setLanguageHeader({ request }: { request?: Request }): void {
  if (request && request.headers && typeof request.headers.set === 'function') {
    if (!request.headers.has('Accept-Language')) {
      request.headers.set('Accept-Language', 'fa');
    }
  }
}

export function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export function buildRequestOptions(body?: unknown, options?: Options): Options {
  if (body === undefined) {
    return options || {};
  }

  if (!isFormData(body)) {
    return { ...options, json: body };
  }

  const { headers, ...restOptions } = options || {};
  const cleanHeaders = { ...(headers as Record<string, string> | undefined) };
  delete cleanHeaders['Content-Type'];
  delete cleanHeaders['content-type'];

  return { ...restOptions, headers: cleanHeaders, body };
}

export async function parseBackendError({ error }: BeforeErrorState): Promise<Error> {
  if (error && typeof error === 'object' && 'response' in error) {
    const errObj = error as Record<string, unknown>;
    type ErrorBody = { message?: string; error?: { message?: string } | string; detail?: string; code?: string };
    let data = errObj.data as ErrorBody | undefined;

    if (!data && errObj.response) {
      const response = errObj.response as Response;
      if (typeof response.clone === 'function' && !response.bodyUsed) {
        try {
          const clonedRes = response.clone();
          const res = await Result.try<ErrorBody>(clonedRes.json());
          if (res.ok && res.value) {
            data = res.value;
          }
        } catch {
          // Ignore clone or body consumption errors
        }
      }
    }

    if (data && typeof data === 'object') {
      const backendMessage =
        data.message ||
        (typeof data.error === 'object' && data.error?.message) ||
        (typeof data.error === 'string' && data.error) ||
        data.detail;
      if (backendMessage && typeof backendMessage === 'string') {
        error.message = backendMessage;
      }
      if (data.code) {
        errObj.code = data.code;
      }
    }
  }
  return error;
}

export async function parseStandardBackendError({ error }: BeforeErrorState): Promise<Error> {
  if (error && typeof error === 'object' && 'response' in error) {
    const errObj = error as Record<string, unknown>;
    type StandardErrorBody = {
      success?: boolean;
      error?: { message?: string; code?: string } | string;
      message?: string;
      detail?: string;
    };

    let data = errObj.data as StandardErrorBody | undefined;

    if (!data && errObj.response) {
      const response = errObj.response as Response;
      if (typeof response.clone === 'function' && !response.bodyUsed) {
        try {
          const clonedRes = response.clone();
          const res = await Result.try<StandardErrorBody>(clonedRes.json());
          if (res.ok && res.value) {
            data = res.value;
          }
        } catch {
          // Ignore clone or body consumption errors
        }
      }
    }

    if (data && typeof data === 'object') {
      const backendMessage =
        (typeof data.error === 'object' && data.error?.message) ||
        (typeof data.error === 'string' && data.error) ||
        data.message ||
        data.detail;

      if (backendMessage && typeof backendMessage === 'string') {
        error.message = backendMessage;
      }
    }
  }
  return error;
}


