'use client';

import { useEffect, useRef } from 'react';
import pLimit from 'p-limit';
import { toast } from 'sonner';
import { Result } from '@/lib/utils/result';
import { type MediaKind } from '../types';
import { useMediaStore } from '../services/mediaStore';
import { createChunkStrategy } from '../services/chunkStrategy';
import { validateBatch } from '../services/validateBatch';
import { buildMediaItem } from '../services/buildMediaItem';
import { MAX_IMAGES } from '../constants';

const ERROR_MAP = {
  video: {
    size: 'حجم ویدیو نباید بیشتر از ۵۰۰ مگابایت باشد',
    format: 'فقط MP4، WebM و MOV مجاز است',
  },
  image: {
    size: 'حجم عکس نباید بیشتر از ۱۰ مگابایت باشد',
    format: 'فقط JPG، PNG و WebP مجاز است',
  },
} as const;

export function useMediaUpload() {
  const limit = useRef(pLimit(3));
  const controllers = useRef(new Map<string, AbortController>());
  const strategy = useRef(createChunkStrategy());

  useEffect(() => {
    const activeControllers = controllers.current;
    const activeLimit = limit.current;
    return () => {
      for (const ctrl of activeControllers.values()) ctrl.abort();

      activeControllers.clear();
      activeLimit.clearQueue();
    };
  }, []);

  async function uploadOne(id: string, file: File): Promise<void> {
    const ctrl = controllers.current.get(id);

    // Slot opened after cancelUpload() already fired — nothing to do.
    if (!ctrl || ctrl.signal.aborted) return;

    useMediaStore.getState()._setStatus(id, 'uploading');

    const result = await Result.try(
      strategy.current.upload(id, file,
        (pct) => useMediaStore.getState()._setProgress(id, pct),
        ctrl.signal,
      ),
    );

    controllers.current.delete(id);

    Result.match(result, {
      ok: (url) => useMediaStore.getState()._setUploaded(id, url),
      err: () => ctrl.signal.aborted
        ? useMediaStore.getState()._setStatus(id, 'cancelled')
        : useMediaStore.getState()._setStatus(id, 'failed'),
    });
  }

  function addFiles(files: File[], kind: MediaKind = 'image') {
    const currentCount = useMediaStore.getState().itemMap.size;
    const remaining = MAX_IMAGES - currentCount;

    if (remaining <= 0) return;

    const capped = files.slice(0, remaining);

    const { valid, rejected } = validateBatch(capped, kind);

    if (rejected.length > 0) {
      const allSizeErrors = rejected.every((r) => r.reason.includes('حجم'));
      const type = allSizeErrors ? 'size' : 'format';

      const title = ERROR_MAP[kind][type];

      toast.warning(title, {
        description: `${rejected.length} فایل نادیده گرفته شد`,
        position: 'top-center',
      });
    }

    if (valid.length === 0) return;

    const items = valid.map((f) => buildMediaItem(f, kind));
    useMediaStore.getState().addItems(items);

    for (const item of items) {
      const ctrl = new AbortController();
      controllers.current.set(item.id, ctrl);
      void limit.current(() => uploadOne(item.id, item.file!));
    }
  }

  function cancelUpload(id: string) {
    const ctrl = controllers.current.get(id);
    if (!ctrl) return;
    ctrl.abort();
    useMediaStore.getState()._setStatus(id, 'cancelled');
    controllers.current.delete(id);
  }

  function retryUpload(id: string) {
    const item = useMediaStore.getState().itemMap.get(id);
    if (!item || !item.file) return;

    useMediaStore.getState()._setStatus(id, 'queued');

    const ctrl = new AbortController();
    controllers.current.set(id, ctrl);
    void limit.current(() => uploadOne(id, item.file!));
  }

  function removeItem(id: string) {
    const item = useMediaStore.getState().itemMap.get(id);
    cancelUpload(id);
    useMediaStore.getState().removeItem(id);

    if (item?.uploadedUrl) {
      void fetch(`/api/upload/${id}`, { method: 'DELETE' });
    }
  }

  return { addFiles, cancelUpload, removeItem, retryUpload };
}
