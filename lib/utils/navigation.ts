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

// Export helpers for tests
export function getIsInternal() {
  return isInternal;
}

export function setIsInternal(val: boolean) {
  isInternal = val;
}
