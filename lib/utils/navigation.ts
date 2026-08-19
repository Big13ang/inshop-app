import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

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

// Export helpers for tests
export function getIsInternal() {
  return isInternal;
}

export function setIsInternal(val: boolean) {
  isInternal = val;
}

