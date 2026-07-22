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

export type RequestInterceptor = (url: string, options: HttpRequestOptions) => void;
export type ResponseInterceptor = (response: Response | null, errorData: HttpError | null) => void;

export const navigation = {
  redirect(url: string): void {
    if (typeof window !== 'undefined' && window.location?.pathname !== url) {
      window.location.href = url;
    }
  },
};

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

function handleUnauthorizedInterceptor(response: Response | null, errorData: HttpError | null): void {
  const status = response?.status ?? errorData?.status;
  if (status === 401) {
    navigation.redirect('/auth/login');
  }
}

// Register default built-in 401 interceptor
responseInterceptors.push(handleUnauthorizedInterceptor);

function runRequestInterceptors(url: string, options: HttpRequestOptions): void {
  for (const interceptor of requestInterceptors) {
    try {
      interceptor(url, options);
    } catch {
      // Interceptor execution errors should not break request flow
    }
  }
}

function runResponseInterceptors(response: Response | null, errorData: HttpError | null): void {
  for (const interceptor of responseInterceptors) {
    try {
      interceptor(response, errorData);
    } catch {
      // Interceptor execution errors should not break request flow
    }
  }
}

export const http = {
  interceptors: {
    request: {
      use(interceptor: RequestInterceptor): () => void {
        requestInterceptors.push(interceptor);
        return function unregister() {
          const index = requestInterceptors.indexOf(interceptor);
          if (index !== -1) {
            requestInterceptors.splice(index, 1);
          }
        };
      },
    },
    response: {
      use(interceptor: ResponseInterceptor): () => void {
        responseInterceptors.push(interceptor);
        return function unregister() {
          const index = responseInterceptors.indexOf(interceptor);
          if (index !== -1) {
            responseInterceptors.splice(index, 1);
          }
        };
      },
    },
  },

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

    runRequestInterceptors(absoluteUrl, options);

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
        runResponseInterceptors(response, errorData);
        return Result.err(errorData);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        if (json && typeof json === 'object' && 'success' in json) {
          if (!json.success) {
            const errorData: HttpError = {
              status: response.status,
              message: json.message || 'Request failed',
              raw: json,
            };
            runResponseInterceptors(response, errorData);
            return Result.err(errorData);
          }
          runResponseInterceptors(response, null);
          if ('pagination' in json) {
            return Result.ok({
              data: json.data,
              pagination: json.pagination,
            } as unknown as T);
          }
          return Result.ok(json.data as T);
        }
        runResponseInterceptors(response, null);
        return Result.ok(json as T);
      }

      const text = await response.text();
      runResponseInterceptors(response, null);
      return Result.ok(text as unknown as T);
    } catch (err) {
      const durationMs = Math.round(performance.now() - startedAt);
      debugAuth('http', 'request:error', {
        method: restOptions.method ?? 'GET',
        url: absoluteUrl,
        durationMs,
        error: err instanceof Error ? err.message : String(err),
      });

      const errorData: HttpError = {
        message: err instanceof Error ? err.message : 'Network error',
        raw: err,
      };
      runResponseInterceptors(null, errorData);
      return Result.err(errorData);
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

