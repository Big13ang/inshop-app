import { http } from '@/lib/utils';
import { useMediaStore } from './mediaStore';

// Singleton promise — resolves once the session is ready (or if one already exists).
// All callers await the same promise; the POST fires exactly once.
let sessionPromise: Promise<void> | null = null;

/**
 * Ensures an upload session exists in the store.
 * Safe to call multiple times — the HTTP request is made at most once.
 * Does NOT use useEffect; callers simply await this before uploading.
 */
export function ensureSession(): Promise<void> {
  if (sessionPromise) return sessionPromise;

  const { uploadSessionId } = useMediaStore.getState();
  if (uploadSessionId) {
    sessionPromise = Promise.resolve();
    return sessionPromise;
  }

  sessionPromise = http
    .post<{ uploadSessionId: string; expiresAt: string }>('/upload-sessions')
    .then((res) => {
      if (res.ok) {
        useMediaStore
          .getState()
          .setUploadSession(res.value.uploadSessionId, res.value.expiresAt);
      }
    });

  return sessionPromise;
}

/**
 * Resets the singleton so the next ensureSession() call re-fetches.
 * Call this after the store is reset (e.g. after successful post submission).
 */
export function resetSessionPromise(): void {
  sessionPromise = null;
}
