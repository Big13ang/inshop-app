import { useSyncExternalStore } from 'react';

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

function getServerSnapshot() {
  return false;
}

/** Re-reads a boolean derived from the window scroll position on every scroll/resize. */
export function useScrollState(getSnapshot: () => boolean): boolean {
  return useSyncExternalStore(subscribeToScroll, getSnapshot, getServerSnapshot);
}
