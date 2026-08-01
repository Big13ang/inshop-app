import { http, createHttpClient } from '../http';
import { authHttp } from '../authHttp';

describe('Ky-backed HTTP client instances', () => {
  it('creates native KyInstance objects with http and authHttp', () => {
    expect(http).toBeDefined();
    expect(authHttp).toBeDefined();
    expect(typeof http.get).toBe('function');
    expect(typeof http.post).toBe('function');
    expect(typeof authHttp.get).toBe('function');
    expect(typeof authHttp.post).toBe('function');
  });

  it('createHttpClient creates a custom KyInstance with prefix', () => {
    const customClient = createHttpClient('http://localhost:9000');
    expect(customClient).toBeDefined();
    expect(typeof customClient.get).toBe('function');
  });
});

describe('parseBackendError', () => {
  it('updates error.message and error.code from response JSON', async () => {
    const mockResponse = {
      clone: () => ({
        json: async () => ({
          message: 'شماره موبایل یا رمز عبور نادرست است.',
          code: 'INVALID_PHONE_OR_PASSWORD',
        }),
      }),
    } as unknown as Response;

    const mockError = new Error('Request failed with status code 401 Unauthorized');
    (mockError as unknown as Record<string, unknown>).response = mockResponse;

    const { parseBackendError } = await import('../httpConfig');
    const resultError = await parseBackendError({ error: mockError } as any);

    expect(resultError.message).toBe('شماره موبایل یا رمز عبور نادرست است.');
    expect((resultError as unknown as Record<string, unknown>).code).toBe('INVALID_PHONE_OR_PASSWORD');
  });

  it('keeps original message if response JSON has no message property', async () => {
    const mockResponse = {
      clone: () => ({
        json: async () => ({ foo: 'bar' }),
      }),
    } as unknown as Response;

    const mockError = new Error('Request failed with status code 500 Internal Server Error');
    (mockError as unknown as Record<string, unknown>).response = mockResponse;

    const { parseBackendError } = await import('../httpConfig');
    const resultError = await parseBackendError({ error: mockError } as any);

    expect(resultError.message).toBe('Request failed with status code 500 Internal Server Error');
  });
});
