import { useSyncExternalStore } from 'react';
import { isMobile } from '@/lib/utils/platform';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('resize', callback);
  const mql = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 768px)') : null;
  if (mql) {
    mql.addEventListener('change', callback);
  }

  return () => {
    window.removeEventListener('resize', callback);
    if (mql) {
      mql.removeEventListener('change', callback);
    }
  };
}

export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth < 768) return false;

  const hasFinePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;

  if (hasFinePointer) return true;

  return !isMobile();
}

function getSnapshot(): boolean {
  return isDesktopDevice();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
