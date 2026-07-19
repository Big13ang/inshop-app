import { env } from '@/env';
import { Result } from './result';
import { debugAuth } from './authDebug';

export interface HttpError {
  status?: number;
  message: string;
  code?: string;
  raw?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    currentDateTime?: string;
    [key: string]: unknown;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
  };
}

export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export const http = {
  async request<T>(url: string, options: HttpRequestOptions = {}): Promise<Result<T, HttpError>> {
    const startedAt = performance.now();
    const { body, headers: customHeaders, ...restOptions } = options;
    const headers = new Headers(customHeaders);

    let absoluteUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const baseUrl = env.NEXT_PUBLIC_API_URL.endsWith('/')
        ? env.NEXT_PUBLIC_API_URL.slice(0, -1)
        : env.NEXT_PUBLIC_API_URL;
      const normalizedPath = url.startsWith('/') ? url : `/${url}`;
      absoluteUrl = `${baseUrl}${normalizedPath}`;
    }

    debugAuth('http', 'request:start', {
      method: restOptions.method ?? 'GET',
      url: absoluteUrl,
      hasBody: body !== undefined,
      credentials: 'include',
    });

    let serializedBody: BodyInit | undefined;
    if (body !== undefined) {
      if (
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        body instanceof Blob ||
        body instanceof ArrayBuffer
      ) {
        serializedBody = body as BodyInit;
      } else {
        headers.set('Content-Type', 'application/json');
        serializedBody = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(absoluteUrl, {
        ...restOptions,
        headers,
        body: serializedBody,
        credentials: 'include',
      });
      const durationMs = Math.round(performance.now() - startedAt);

      debugAuth('http', 'request:response', {
        method: restOptions.method ?? 'GET',
        url: absoluteUrl,
        status: response.status,
        ok: response.ok,
        durationMs,
        contentType: response.headers.get('content-type'),
        hasSetCookieHeader: response.headers.has('set-cookie'),
      });

      if (!response.ok) {
        const errorData: HttpError = {
          status: response.status,
          message: `Request failed with status ${response.status}`,
        };
        try {
          const json = await response.json();
          if (json && json.error) {
            errorData.code = json.error.code;
            errorData.message = json.error.message || errorData.message;
          } else if (json && json.message) {
            errorData.message = json.message;
          }
          errorData.raw = json;
        } catch {
          // not JSON or body already read
        }
        return Result.err(errorData);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        if (json && typeof json === 'object' && 'success' in json) {
          if (!json.success) {
            return Result.err({
              status: response.status,
              message: json.message || 'Request failed',
              raw: json,
            });
          }
          if ('pagination' in json) {
            return Result.ok({
              data: json.data,
              pagination: json.pagination,
            } as unknown as T);
          }
          return Result.ok(json.data as T);
        }
        return Result.ok(json as T);
      }

      const text = await response.text();
      return Result.ok(text as unknown as T);
    } catch (err) {
      const durationMs = Math.round(performance.now() - startedAt);
      debugAuth('http', 'request:error', {
        method: restOptions.method ?? 'GET',
        url: absoluteUrl,
        durationMs,
        error: err instanceof Error ? err.message : String(err),
      });

      return Result.err({
        message: err instanceof Error ? err.message : 'Network error',
        raw: err,
      });
    }
  },

  async get<T>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<Result<T, HttpError>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  },

  async post<T>(url: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<Result<T, HttpError>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  },

  async patch<T>(url: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<Result<T, HttpError>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  },

  async delete<T>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<Result<T, HttpError>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  },
};
