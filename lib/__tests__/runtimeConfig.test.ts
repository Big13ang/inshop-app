/**
 * @jest-environment node
 */
import { getPublicApiUrl, getPublicCdnUrl, getRuntimeApiUrl, readServerRuntimeConfig } from '../runtimeConfig';

describe('runtimeConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PUBLIC_API_URL;
    delete process.env.PUBLIC_CDN_URL;
    delete (global as any).window;
  });

  afterEach(() => {
    delete (global as any).window;
    process.env = originalEnv;
  });

  describe('readServerRuntimeConfig', () => {
    it('omits values that are not set so the client keeps its build-time fallback', () => {
      expect(JSON.stringify(readServerRuntimeConfig())).toBe('{}');
    });

    it('reads PUBLIC_API_URL and PUBLIC_CDN_URL from the runtime environment', () => {
      process.env.PUBLIC_API_URL = 'https://api.e2e.example.com';
      process.env.PUBLIC_CDN_URL = 'https://cdn.e2e.example.com/bucket';

      expect(readServerRuntimeConfig()).toEqual({
        apiUrl: 'https://api.e2e.example.com',
        cdnUrl: 'https://cdn.e2e.example.com/bucket',
      });
    });
  });

  describe('on the server', () => {
    it('falls back to the build-time URLs when no override is set', () => {
      expect(getRuntimeApiUrl()).toBeUndefined();
      expect(getPublicApiUrl()).toBe('http://localhost:3000');
      expect(getPublicCdnUrl()).toBe('http://localhost:9000/inshop-uploads');
    });

    it('prefers the runtime overrides and strips trailing slashes', () => {
      process.env.PUBLIC_API_URL = 'https://api.e2e.example.com/';
      process.env.PUBLIC_CDN_URL = 'https://cdn.e2e.example.com/bucket/';

      expect(getRuntimeApiUrl()).toBe('https://api.e2e.example.com');
      expect(getPublicApiUrl()).toBe('https://api.e2e.example.com');
      expect(getPublicCdnUrl()).toBe('https://cdn.e2e.example.com/bucket');
    });
  });

  describe('in the browser', () => {
    it('reads the config injected by /runtime-config.js, not process.env', () => {
      process.env.PUBLIC_API_URL = 'https://ignored-in-browser.example.com';
      (global as any).window = {
        __INSHOP_RUNTIME_CONFIG__: { apiUrl: 'https://api.e2e.example.com', cdnUrl: 'https://cdn.e2e.example.com' },
      };

      expect(getRuntimeApiUrl()).toBe('https://api.e2e.example.com');
      expect(getPublicApiUrl()).toBe('https://api.e2e.example.com');
      expect(getPublicCdnUrl()).toBe('https://cdn.e2e.example.com');
    });

    it('falls back to the build-time URLs when the script did not load', () => {
      (global as any).window = {};

      expect(getRuntimeApiUrl()).toBeUndefined();
      expect(getPublicApiUrl()).toBe('http://localhost:3000');
      expect(getPublicCdnUrl()).toBe('http://localhost:9000/inshop-uploads');
    });
  });
});
