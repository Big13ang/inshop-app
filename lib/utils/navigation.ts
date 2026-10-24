import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Result } from './result';

const DEFAULT_POST_LOGIN_PATH = '/app/profile';

let isInternal = false;

if (typeof window !== 'undefined') {
  const originalPush = window.history.pushState;
  window.history.pushState = function (...args) {
    isInternal = true;
    originalPush.apply(this, args);
  };
}

export function goBackSafely(router: AppRouterInstance) {
  if (isInternal) {
    router.back();
  } else {
    router.replace('/');
  }
}

/**
 * Constructs a login URL with an optional callback URL target.
 *
 * @param targetUrl Optional target path or full URL to redirect back to after login.
 * @returns Encoded login URL string with callbackUrl query param if targetUrl is valid.
 */
export function getLoginUrlWithCallback(targetUrl?: string | null): string {
  if (!targetUrl || targetUrl.startsWith('/auth')) {
    return '/auth/login';
  }
  return `/auth/login?callbackUrl=${encodeURIComponent(targetUrl)}`;
}

// The origin of the page being viewed (localhost, dev.inshop.social, inshop.social, ...).
// Only meaningful in the browser; the helper below is only called from client components.
function getCurrentOrigin(): string | null {
  return typeof window === 'undefined' ? null : window.location.origin;
}

function hasControlCharacter(value: string): boolean {
  return value.split('').some((char) => {
    const code = char.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
}

/**
 * Returns `raw` only when it is a same-origin relative path; otherwise returns the fallback.
 * Rejects absolute URLs, protocol-relative URLs, backslash tricks, control characters and auth pages.
 */
export function getSafeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = DEFAULT_POST_LOGIN_PATH
): string {
  if (!raw || raw !== raw.trim()) return fallback;
  if (raw.includes('\\') || hasControlCharacter(raw)) return fallback;

  const origin = getCurrentOrigin();
  if (!origin) return fallback;

  const parsed = Result.trySync(() => new URL(raw, origin));
  if (!parsed.ok || parsed.value.origin !== origin) return fallback;

  const { pathname, search, hash } = parsed.value;
  if (pathname === '/auth' || pathname.startsWith('/auth/')) return fallback;

  return `${pathname}${search}${hash}`;
}

// Export helpers for tests
export function getIsInternal() {
  return isInternal;
}

export function setIsInternal(val: boolean) {
  isInternal = val;
}

