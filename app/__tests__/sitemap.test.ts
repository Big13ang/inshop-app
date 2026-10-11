import sitemap from '../sitemap';

describe('sitemap', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns sitemap entries with production domain in non-dev environment', () => {
    process.env.APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_APP_URL;

    const result = sitemap();

    expect(result).toHaveLength(5);
    expect(result[0].url).toBe('https://inshop.social');
    expect(result[0].priority).toBe(1.0);
    expect(result[0].changeFrequency).toBe('daily');

    expect(result[1].url).toBe('https://inshop.social/about');
    expect(result[2].url).toBe('https://inshop.social/contact');
    expect(result[3].url).toBe('https://inshop.social/privacy');
    expect(result[4].url).toBe('https://inshop.social/terms');
  });

  it('returns sitemap entries with dev domain in development environment', () => {
    process.env.APP_ENV = 'dev';
    process.env.NEXT_PUBLIC_APP_ENV = 'dev';
    delete process.env.NEXT_PUBLIC_APP_URL;

    const result = sitemap();

    expect(result).toHaveLength(5);
    expect(result[0].url).toBe('https://dev.inshop.social');
    expect(result[1].url).toBe('https://dev.inshop.social/about');
    expect(result[2].url).toBe('https://dev.inshop.social/contact');
    expect(result[3].url).toBe('https://dev.inshop.social/privacy');
    expect(result[4].url).toBe('https://dev.inshop.social/terms');
  });

  it('respects NEXT_PUBLIC_APP_URL when explicitly configured', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:4000/';

    const result = sitemap();

    expect(result).toHaveLength(5);
    expect(result[0].url).toBe('http://localhost:4000');
    expect(result[1].url).toBe('http://localhost:4000/about');
  });
});
