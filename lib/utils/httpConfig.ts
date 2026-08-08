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
    let data = errObj.data as { message?: string; error?: string; detail?: string; code?: string } | undefined;

    if (!data && errObj.response) {
      const resObj = errObj.response as Response;
      if (!resObj.bodyUsed && typeof resObj.clone === 'function') {
        const res = await Result.try<{ message?: string; error?: string; detail?: string; code?: string }>(
          () => resObj.clone().json()
        );
        if (res.ok && res.value) {
          data = res.value;
        }
      }
    }

    if (data && typeof data === 'object') {
      const backendMessage = data.message || data.error || data.detail;
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
  if (error && 'response' in error && error.response) {
    const resObj = error.response as Response;
    if (!resObj.bodyUsed && typeof resObj.clone === 'function') {
      const res = await Result.try<{ error?: { message?: string } }>(
        () => resObj.clone().json()
      );
      if (res.ok && res.value?.error?.message) {
        error.message = res.value.error.message;
      }
    }
  }
  return error;
}

