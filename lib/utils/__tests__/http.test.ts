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
