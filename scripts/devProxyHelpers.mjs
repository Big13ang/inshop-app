// Pure helpers for scripts/dev-proxy.mjs (kept separate so they can be unit tested).

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:4000', 'http://127.0.0.1:4000'];

/**
 * Points an upstream `Location` header back at the proxy. Only rewrites when the
 * Location host equals the target host (any scheme); everything else is untouched.
 */
export function rewriteLocation(location, targetUrl, proxyOrigin) {
  let parsed;
  try {
    parsed = new URL(location);
  } catch {
    return location;
  }
  if (parsed.host !== targetUrl.host) return location;
  return `${proxyOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/** Built-in dev origins plus a comma-separated extra list (DEV_PROXY_ALLOWED_ORIGINS). */
export function buildAllowedOrigins(extra = '') {
  const added = extra
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...added]);
}
