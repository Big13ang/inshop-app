'use client';

import { useEffect } from 'react';

export function useServiceWorkerUpdateReload(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('serviceWorker' in navigator)) return;

    let hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    function handleControllerChange(): void {
      if (!hadController) {
        hadController = true;
        return;
      }

      if (reloading) return;
      reloading = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  }, [enabled]);
}
