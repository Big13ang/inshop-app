import { env } from '@/env';

export interface RuntimeConfig {
  apiUrl?: string;
  cdnUrl?: string;
}

declare global {
  interface Window {
    __INSHOP_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Deploy-time URL overrides. Unlike NEXT_PUBLIC_* values these are not inlined by
 * `next build`, so one image can run against several backends (e2e, dev, prod).
 * Unset values are left out so the browser keeps its build-time fallback.
 */
export function readServerRuntimeConfig(): RuntimeConfig {
  return {
    apiUrl: process.env.PUBLIC_API_URL || undefined,
    cdnUrl: process.env.PUBLIC_CDN_URL || undefined,
  };
}

// In the browser the overrides come from /runtime-config.js, loaded by the root layouts.
function readRuntimeConfig(): RuntimeConfig {
  if (typeof window !== 'undefined') {
    return window.__INSHOP_RUNTIME_CONFIG__ ?? {};
  }
  return readServerRuntimeConfig();
}

export function getRuntimeApiUrl(): string | undefined {
  const { apiUrl } = readRuntimeConfig();
  return apiUrl ? trimTrailingSlash(apiUrl) : undefined;
}

export function getPublicApiUrl(): string {
  return getRuntimeApiUrl() ?? trimTrailingSlash(env.NEXT_PUBLIC_API_URL);
}

export function getPublicCdnUrl(): string {
  return trimTrailingSlash(readRuntimeConfig().cdnUrl ?? env.NEXT_PUBLIC_CDN_URL ?? '');
}
