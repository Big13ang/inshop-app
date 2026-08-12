import ky, { Options } from 'ky';
import { getBaseUrl, setLanguageHeader, parseBackendError, buildRequestOptions, handleJsonResponse } from './httpConfig';
import { Result } from './result';

export function createAuthHttpClient(prefixUrl?: string) {
  const client = ky.create({
    prefix: getBaseUrl(prefixUrl),
    credentials: 'include',
    hooks: {
      beforeRequest: [setLanguageHeader],
      beforeError: [parseBackendError],
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

export const authHttp = createAuthHttpClient();
