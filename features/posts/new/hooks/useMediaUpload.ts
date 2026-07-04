'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { type MediaKind } from '../types';
import { useMediaStore } from '../services/mediaStore';
import { type UploadService, createUploadService } from '../services/uploadService';
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
  const service = useRef<UploadService | null>(null);
  if (service.current == null) { service.current = createUploadService(); }

  useEffect(() => {
    const current = service.current!;
    return () => current.cancelAll();
  }, []);

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
    service.current!.enqueue(items);
  }

  function cancelUpload(id: string) {
    service.current!.cancel(id);
  }

  function retryUpload(id: string) {
    service.current!.retry(id);
  }

  function removeItem(id: string) {
    const item = useMediaStore.getState().itemMap.get(id);
    service.current!.cancel(id);
    useMediaStore.getState().removeItem(id);

    // 'uploaded' has a server file via uploadedUrl; 'uploading' has one
    // because the upload already started — both need server-side cleanup.
    if (item?.uploadedUrl || item?.status === 'uploading') {
      void fetch(`/api/upload/${id}`, { method: 'DELETE' });
    }
  }

  return { addFiles, cancelUpload, removeItem, retryUpload };
}
