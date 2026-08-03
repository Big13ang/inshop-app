import ky, { KyInstance, Options, HTTPError } from 'ky';
import { getBaseUrl, setLanguageHeader, parseStandardBackendError } from './httpConfig';
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
      beforeError: [parseStandardBackendError],
    },
  });

  return {
    get: async <T>(url: string, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.get(url.replace(/^\//, ''), options).json<T>())
      ),
    post: async <T>(url: string, body?: unknown, options?: Options): Promise<T> => {
      const bodyOption = typeof FormData !== 'undefined' && body instanceof FormData ? { body } : body !== undefined ? { json: body } : {};
      return Result.unwrap(
        await Result.try(client.post(url.replace(/^\//, ''), { ...options, ...bodyOption }).json<T>())
      );
    },
    put: async <T>(url: string, body?: unknown, options?: Options): Promise<T> => {
      const bodyOption = typeof FormData !== 'undefined' && body instanceof FormData ? { body } : body !== undefined ? { json: body } : {};
      return Result.unwrap(
        await Result.try(client.put(url.replace(/^\//, ''), { ...options, ...bodyOption }).json<T>())
      );
    },
    patch: async <T>(url: string, body?: unknown, options?: Options): Promise<T> => {
      const bodyOption = typeof FormData !== 'undefined' && body instanceof FormData ? { body } : body !== undefined ? { json: body } : {};
      return Result.unwrap(
        await Result.try(client.patch(url.replace(/^\//, ''), { ...options, ...bodyOption }).json<T>())
      );
    },
    delete: async <T>(url: string, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.delete(url.replace(/^\//, ''), options).json<T>())
      ),
    ky: client,
  };
}

// General HTTP client instance for standard ApiResponse<T> endpoints
export const http = createHttpClient();