import pLimit from 'p-limit';
import { toast } from 'sonner';
import { Result } from '@/lib/utils/result';
import { type MediaItem } from '../types';
import { type UploadStrategy, createChunkStrategy } from './chunkStrategy';
import { useMediaStore } from './mediaStore';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

export interface UploadService {
  /** Queues items for upload, respecting the concurrency limit. */
  enqueue(items: MediaItem[]): void;
  /** Aborts an in-flight or queued upload and marks it cancelled. */
  cancel(id: string): void;
  /** Re-queues a previously failed upload. */
  retry(id: string): void;
  /** Aborts every in-flight upload and drains the queue. */
  cancelAll(): void;
}

export function createUploadService(
  strategy: UploadStrategy = createChunkStrategy(),
  concurrency = 3,
): UploadService {
  const limit = pLimit(concurrency);
  const controllers = new Map<string, AbortController>();

  async function uploadOne(id: string, file: File): Promise<void> {
    const ctrl = controllers.get(id);

    // Slot opened after cancel() already fired — nothing to do.
    if (!ctrl || ctrl.signal.aborted) return;

    useMediaStore.getState()._setStatus(id, 'uploading');

    const uploadSessionId = useMediaStore.getState().uploadSessionId || undefined;

    const result = await Result.try(
      strategy.upload({
        id,
        file,
        onProgress: (pct) => useMediaStore.getState()._setProgress(id, pct),
        signal: ctrl.signal,
        options: { uploadSessionId },
      }),
    );

    controllers.delete(id);

    // cancel() may have fired while the request was already settling —
    // its outcome no longer matters once the user has cancelled.
    if (ctrl.signal.aborted) {
      useMediaStore.getState()._setStatus(id, 'cancelled');
      return;
    }

    Result.match(result, {
      ok: (url) => useMediaStore.getState()._setUploaded(id, url),
      err: (error) => {
        useMediaStore.getState()._setStatus(id, 'failed');
        let errorMsg = ERROR_MESSAGES.upload.failed;
        if (error instanceof Error) {
          if (error.message.includes('resolution') || error.message.includes('1080')) {
            errorMsg = ERROR_MESSAGES.upload.resolutionTooSmall;
          } else {
            const cleanMsg = error.message.replace(/^tus:\s*/i, '');
            if (cleanMsg && cleanMsg.length < 150) {
              errorMsg = cleanMsg;
            }
          }
        }
        toast.error(errorMsg);
      },
    });
  }

  function enqueue(items: MediaItem[]): void {
    for (const item of items) {
      if (!item.file) continue;
      const ctrl = new AbortController();
      controllers.set(item.id, ctrl);
      void limit(() => uploadOne(item.id, item.file!));
    }
  }

  function cancel(id: string): void {
    const ctrl = controllers.get(id);
    if (!ctrl) return;
    ctrl.abort();
    useMediaStore.getState()._setStatus(id, 'cancelled');
    controllers.delete(id);
  }

  function retry(id: string): void {
    const item = useMediaStore.getState().itemMap.get(id);
    if (!item || !item.file) return;

    useMediaStore.getState()._setStatus(id, 'queued');

    const ctrl = new AbortController();
    controllers.set(id, ctrl);
    void limit(() => uploadOne(id, item.file!));
  }

  function cancelAll(): void {
    for (const ctrl of controllers.values()) ctrl.abort();
    controllers.clear();
    limit.clearQueue();
  }

  return { enqueue, cancel, retry, cancelAll };
}
