'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { type MediaKind } from '../types';
import { useMediaStore } from '../services/mediaStore';
import { type UploadService, createUploadService } from '../services/uploadService';
import { validateBatch } from '../services/validateBatch';
import { buildMediaItem } from '../services/buildMediaItem';
import { MAX_IMAGES } from '../constants';
import { http, formatToUUID } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

const ERROR_MAP = {
  video: {
    size: ERROR_MESSAGES.upload.videoSizeLimit,
    format: ERROR_MESSAGES.upload.videoFormatLimit,
  },
  image: {
    size: ERROR_MESSAGES.upload.imageSizeLimit,
    format: ERROR_MESSAGES.upload.imageFormatLimit,
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
    const uploadSessionId = useMediaStore.getState().uploadSessionId;
    if (!uploadSessionId) {
      toast.warning(ERROR_MESSAGES.upload.preparingUpload);
      return;
    }


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

    // Only delete from server if the file was actually uploaded.
    if (item?.uploadedUrl || item?.status === 'uploaded') {
      const uploadSessionId = useMediaStore.getState().uploadSessionId;
      if (uploadSessionId) {
        const url = item.uploadedUrl;
        const mediaId = url ? url.substring(url.lastIndexOf('/') + 1) : id;
        const formattedMediaId = formatToUUID(mediaId);
        void http.delete(
          `/upload-sessions/${uploadSessionId}/photos/${formattedMediaId}`
        );
      }
    }
  }

  return { addFiles, cancelUpload, removeItem, retryUpload };
}
