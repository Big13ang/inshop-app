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
    process.env.APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';

    const result = robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/auth/', '/api/', '/_next/'],
    });
    expect(result.sitemap).toBe('https://inshop.social/sitemap.xml');
  });
});
