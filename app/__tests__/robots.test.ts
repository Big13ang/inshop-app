import robots from '../robots';

describe('robots', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns disallow all rules in dev environment', () => {
    process.env.APP_ENV = 'dev';
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      disallow: '/',
    });
    expect(result.sitemap).toBeUndefined();
  });

  it('returns allowed rules and sitemap in production environment', () => {
    delete process.env.APP_ENV;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_URL = 'https://inshop.social';

    const result = robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/auth/', '/api/', '/_next/'],
    });
    expect(result.sitemap).toBe('https://inshop.social/sitemap.xml');
  });
});
