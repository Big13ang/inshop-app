import ky, { Options } from 'ky';
import { getBaseUrl, setLanguageHeader, parseBackendError, buildRequestOptions } from './httpConfig';
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
        await Result.try(client.get(url.replace(/^\//, ''), options).json<T>())
      ),
    post: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.post(url.replace(/^\//, ''), buildRequestOptions(body, options)).json<T>())
      ),
    put: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.put(url.replace(/^\//, ''), buildRequestOptions(body, options)).json<T>())
      ),
    patch: async <T>(url: string, body?: unknown, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.patch(url.replace(/^\//, ''), buildRequestOptions(body, options)).json<T>())
      ),
    delete: async <T>(url: string, options?: Options): Promise<T> =>
      Result.unwrap(
        await Result.try(client.delete(url.replace(/^\//, ''), options).json<T>())
      ),
    ky: client,
  };
}

export const authHttp = createAuthHttpClient();
