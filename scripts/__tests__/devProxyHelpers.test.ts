import { buildAllowedOrigins, rewriteLocation } from '../devProxyHelpers.mjs';

const TARGET = new URL('https://api.dev.inshop.social');
const PROXY = 'http://127.0.0.1:8000';

describe('rewriteLocation', () => {
  it('rewrites the upstream origin to the proxy origin', () => {
    expect(rewriteLocation('https://api.dev.inshop.social/uploads/abc', TARGET, PROXY)).toBe(
      'http://127.0.0.1:8000/uploads/abc',
    );
  });

  it('leaves a foreign host untouched', () => {
    const foreign = 'https://cdn.other.com/uploads/abc';
    expect(rewriteLocation(foreign, TARGET, PROXY)).toBe(foreign);
  });

  it('leaves a lookalike host that merely contains the target untouched', () => {
    const lookalike = 'https://api.dev.inshop.social.evil.com/uploads/abc';
    expect(rewriteLocation(lookalike, TARGET, PROXY)).toBe(lookalike);
  });

  it('handles an http:// upstream Location', () => {
    expect(rewriteLocation('http://api.dev.inshop.social/uploads/abc', TARGET, PROXY)).toBe(
      'http://127.0.0.1:8000/uploads/abc',
    );
  });

  it('preserves path and query', () => {
    expect(rewriteLocation('https://api.dev.inshop.social/uploads/abc?x=1&y=2', TARGET, PROXY)).toBe(
      'http://127.0.0.1:8000/uploads/abc?x=1&y=2',
    );
  });

  it('returns relative or unparsable locations unchanged', () => {
    expect(rewriteLocation('/uploads/abc', TARGET, PROXY)).toBe('/uploads/abc');
  });
});

describe('buildAllowedOrigins', () => {
  it('always includes the local dev origins', () => {
    const origins = buildAllowedOrigins();
    expect(origins.has('http://localhost:4000')).toBe(true);
    expect(origins.has('http://127.0.0.1:4000')).toBe(true);
    expect(origins.has('https://evil.example')).toBe(false);
  });

  it('adds comma-separated extras, trimmed', () => {
    const origins = buildAllowedOrigins(' http://192.168.1.5:4000 , ,http://tunnel.example ');
    expect(origins.has('http://192.168.1.5:4000')).toBe(true);
    expect(origins.has('http://tunnel.example')).toBe(true);
  });
});
