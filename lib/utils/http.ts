import ky, { KyInstance, Options, HTTPError } from 'ky';
import { getBaseUrl, setLanguageHeader, handleUnauthorizedRedirect, parseBackendError } from './httpConfig';
import { Result } from './result';

export type { KyInstance, Options as HttpRequestOptions, HTTPError };

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    currentDateTime?: string;
    [key: string]: unknown;
  };
}

export interface PaginatedApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: {
    nextCursor?: string;
    hasNext?: boolean;
    total?: number;
    [key: string]: unknown;
  };
  meta?: {
    currentDateTime?: string;
    [key: string]: unknown;
  };
}

export function createHttpClient(prefixUrl?: string) {
  const client = ky.create({
    prefix: getBaseUrl(prefixUrl),
    credentials: 'include',
    hooks: {
      beforeRequest: [setLanguageHeader],
      afterResponse: [handleUnauthorizedRedirect],
      beforeError: [parseBackendError],
    },
  });

  return {
    get: async <T>(url: string, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.get(url.replace(/^\//, ''), options).json<T>())
      ),
    post: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.post(url.replace(/^\//, ''), { ...options, json: body }).json<T>())
      ),
    put: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.put(url.replace(/^\//, ''), { ...options, json: body }).json<T>())
      ),
    patch: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.patch(url.replace(/^\//, ''), { ...options, json: body }).json<T>())
      ),
    delete: async <T>(url: string, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.delete(url.replace(/^\//, ''), options).json<T>())
      ),
    ky: client,
  };
}

// General HTTP client instance for standard ApiResponse<T> endpoints
export const http = createHttpClient();