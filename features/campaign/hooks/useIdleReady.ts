import { useSyncExternalStore } from 'react';

const IDLE_TIMEOUT_MS = 3000;
const FALLBACK_DELAY_MS = 1500;

let isIdle = false;
let isScheduled = false;
const listeners = new Set<() => void>();

function markIdle() {
  isIdle = true;
  for (const notify of listeners) notify();
}

function waitForIdle() {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(markIdle, { timeout: IDLE_TIMEOUT_MS });
    return;
  }
  window.setTimeout(markIdle, FALLBACK_DELAY_MS);
}

function scheduleOnce() {
  if (isScheduled) return;
  isScheduled = true;
  if (document.readyState === 'complete') {
    waitForIdle();
    return;
  }
  window.addEventListener('load', waitForIdle, { once: true });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  scheduleOnce();
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  return isIdle;
}

function getServerSnapshot() {
  return false;
}

/** Turns true once the page has finished loading and the browser is idle. */
export function useIdleReady(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
