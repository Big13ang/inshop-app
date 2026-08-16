import ky, { KyInstance, Options, HTTPError } from 'ky';
import { getBaseUrl, setLanguageHeader, parseStandardBackendError, buildRequestOptions, handleJsonResponse } from './httpConfig';
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
        await Result.try(handleJsonResponse<T>(client.get(url.replace(/^\//, ''), options)))
      ),
    post: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(handleJsonResponse<T>(client.post(url.replace(/^\//, ''), buildRequestOptions(body, options))))
      ),
    put: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(handleJsonResponse<T>(client.put(url.replace(/^\//, ''), buildRequestOptions(body, options))))
      ),
    patch: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(handleJsonResponse<T>(client.patch(url.replace(/^\//, ''), buildRequestOptions(body, options))))
      ),
    delete: async <T>(url: string, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(handleJsonResponse<T>(client.delete(url.replace(/^\//, ''), options)))
      ),
    ky: client,
  };
}

// General HTTP client instance for standard ApiResponse<T> endpoints
export const http = createHttpClient();