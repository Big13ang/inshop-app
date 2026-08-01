import ky, { Options } from 'ky';
import { getBaseUrl, setLanguageHeader } from './httpConfig';
import { Result } from './result';

export function createAuthHttpClient(prefixUrl?: string) {
  const client = ky.create({
    prefix: getBaseUrl(prefixUrl),
    credentials: 'include',
    hooks: {
      beforeRequest: [setLanguageHeader],
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

export const authHttp = createAuthHttpClient();
