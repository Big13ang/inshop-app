import robots, { isAllowedProductionHost } from '../robots';
import { headers } from 'next/headers';

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('robots', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (headers as jest.Mock).mockResolvedValue({
      get: () => null,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isAllowedProductionHost', () => {
    it('allows inshop.social and www.inshop.social', () => {
      expect(isAllowedProductionHost('inshop.social')).toBe(true);
      expect(isAllowedProductionHost('www.inshop.social')).toBe(true);
      expect(isAllowedProductionHost('INSHOP.SOCIAL')).toBe(true);
      expect(isAllowedProductionHost('inshop.social:443')).toBe(true);
    });

    it('disallows subdomains like dev.inshop.social and staging.inshop.social', () => {
      expect(isAllowedProductionHost('dev.inshop.social')).toBe(false);
      expect(isAllowedProductionHost('staging.inshop.social')).toBe(false);
      expect(isAllowedProductionHost('api.inshop.social')).toBe(false);
      expect(isAllowedProductionHost('admin.dev.inshop.social')).toBe(false);
      expect(isAllowedProductionHost(null)).toBe(false);
    });
  });

  it('returns disallow all rules in dev environment', async () => {
    process.env.APP_ENV = 'dev';
    const result = await robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      disallow: '/',
    });
    expect(result.sitemap).toBeUndefined();
  });

  it('returns allowed rules and sitemap in production environment for inshop.social', async () => {
    process.env.APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    (headers as jest.Mock).mockResolvedValue({
      get: (name: string) => (name === 'host' ? 'inshop.social' : null),
    });

    const result = await robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/auth/', '/api/'],
    });
    expect(result.sitemap).toBe('https://inshop.social/sitemap.xml');
  });

  it('returns disallow all rules for subdomains like dev.inshop.social via request header', async () => {
    process.env.APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    (headers as jest.Mock).mockResolvedValue({
      get: (name: string) => (name === 'host' ? 'dev.inshop.social' : null),
    });

    const result = await robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      disallow: '/',
    });
    expect(result.sitemap).toBeUndefined();
  });

  it('returns disallow all rules when NEXT_PUBLIC_APP_URL points to a subdomain', async () => {
    process.env.APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_URL = 'https://dev.inshop.social';

    const result = await robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      disallow: '/',
    });
    expect(result.sitemap).toBeUndefined();
  });
});
