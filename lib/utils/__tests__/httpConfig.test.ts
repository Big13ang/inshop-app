/**
 * @jest-environment node
 */
import { getBaseUrl } from '../httpConfig';

describe('getBaseUrl API resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // In node environment, window is initially undefined
    delete (global as any).window;
  });

  afterEach(() => {
    delete (global as any).window;
    process.env = originalEnv;
  });

  describe('override URL', () => {
    it('returns cleaned override URL when provided', () => {
      expect(getBaseUrl('https://custom-api.example.com/')).toBe('https://custom-api.example.com');
      expect(getBaseUrl('http://localhost:9999')).toBe('http://localhost:9999');
    });
  });

  describe('runtime override (PUBLIC_API_URL)', () => {
    it('in the browser, the injected runtime config wins over hostname detection', () => {
      (global as any).window = {
        location: { hostname: 'dev.inshop.social' },
        __INSHOP_RUNTIME_CONFIG__: { apiUrl: 'https://api.e2e.example.com/' },
      };
      expect(getBaseUrl()).toBe('https://api.e2e.example.com');
    });

    it('on the server, INTERNAL_API_URL still wins over PUBLIC_API_URL', () => {
      process.env.INTERNAL_API_URL = 'http://backend:8000';
      process.env.PUBLIC_API_URL = 'https://api.e2e.example.com';
      expect(getBaseUrl()).toBe('http://backend:8000');

      delete process.env.INTERNAL_API_URL;
      expect(getBaseUrl()).toBe('https://api.e2e.example.com');
    });
  });

  describe('client-side browser hostname detection (window is defined)', () => {
    const setWindowHostname = (hostname: string) => {
      (global as any).window = {
        location: {
          hostname,
        },
      };
    };

    it('resolves https://api.dev.inshop.social for dev.inshop.social', () => {
      // Even if build-time NEXT_PUBLIC_APP_ENV was production
      process.env.NEXT_PUBLIC_APP_ENV = 'production';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.inshop.social';
      setWindowHostname('dev.inshop.social');

      expect(getBaseUrl()).toBe('https://api.dev.inshop.social');
    });

    it('resolves https://api.dev.inshop.social for subdomains like admin.dev.inshop.social', () => {
      process.env.NEXT_PUBLIC_APP_ENV = 'production';
      setWindowHostname('admin.dev.inshop.social');
      expect(getBaseUrl()).toBe('https://api.dev.inshop.social');
    });

    it('resolves https://api.dev.inshop.social for dev-admin.inshop.social', () => {
      process.env.NEXT_PUBLIC_APP_ENV = 'production';
      setWindowHostname('dev-admin.inshop.social');
      expect(getBaseUrl()).toBe('https://api.dev.inshop.social');
    });

    it('resolves https://api.dev.inshop.social for dev-app.inshop.social', () => {
      process.env.NEXT_PUBLIC_APP_ENV = 'production';
      setWindowHostname('dev-app.inshop.social');
      expect(getBaseUrl()).toBe('https://api.dev.inshop.social');
    });

    it('resolves localhost to local API or dev API', () => {
      delete process.env.NEXT_PUBLIC_DEV_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
      setWindowHostname('localhost');

      expect(getBaseUrl()).toBe('http://localhost:8000');
    });

    it('resolves https://api.inshop.social strictly for inshop.social', () => {
      setWindowHostname('inshop.social');
      expect(getBaseUrl()).toBe('https://api.inshop.social');
    });

    it('resolves https://api.inshop.social for www.inshop.social', () => {
      setWindowHostname('www.inshop.social');
      expect(getBaseUrl()).toBe('https://api.inshop.social');
    });
  });

  describe('server-side runtime (window is undefined)', () => {
    it('resolves dev API when APP_ENV is dev', () => {
      process.env.APP_ENV = 'dev';
      delete process.env.DEV_API_URL;
      delete process.env.NEXT_PUBLIC_DEV_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      expect(getBaseUrl()).toBe('https://api.dev.inshop.social');
    });

    it('resolves prod API when APP_ENV is production', () => {
      process.env.APP_ENV = 'production';
      delete process.env.PROD_API_URL;
      delete process.env.NEXT_PUBLIC_PROD_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      expect(getBaseUrl()).toBe('https://api.inshop.social');
    });

    it('falls back to dev API in development NODE_ENV', () => {
      delete process.env.APP_ENV;
      delete process.env.NEXT_PUBLIC_APP_ENV;
      delete process.env.NEXT_PUBLIC_API_URL;
      (process.env as any).NODE_ENV = 'development';

      expect(getBaseUrl()).toBe('https://api.dev.inshop.social');
    });
  });
});
