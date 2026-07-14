import { Result } from './result';

export interface HttpError {
  status?: number;
  message: string;
  code?: string;
  raw?: unknown;
}

export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export const http = {
  async request<T>(url: string, options: HttpRequestOptions = {}): Promise<Result<T, HttpError>> {
    const { body, headers: customHeaders, ...restOptions } = options;
    const headers = new Headers(customHeaders);

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
      const response = await fetch(url, {
        ...restOptions,
        headers,
        body: serializedBody,
        credentials: 'include',
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
        return Result.ok(json as T);
      }

      const text = await response.text();
      return Result.ok(text as unknown as T);
    } catch (err) {
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
