'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { type MediaKind } from '../types';
import { useMediaStore } from '../services/mediaStore';
import { type UploadService, createUploadService } from '../services/uploadService';
import { validateBatch } from '../services/validateBatch';
import { buildMediaItem } from '../services/buildMediaItem';
import { useUploadSession } from '../services/uploadSession';
import { MAX_IMAGES } from '../constants';
import { http, extractMediaId } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

export function useMediaUpload() {
  const queryClient = useQueryClient();
  const uploadSession = useUploadSession();
  const service = useRef<UploadService | null>(null);
  if (service.current == null) {
    service.current = createUploadService();
  }

  const [isValidating, setIsValidating] = useState(false);
  const validationController = useRef<AbortController | null>(null);

  // Cleanup on unmount — the only legitimate lifecycle effect here.
  // No state synchronization; purely resource teardown.
  useEffect(() => {
    const current = service.current!;
    return () => {
      current.cancelAll();
      validationController.current?.abort();
    };
  }, []);

  async function addFiles(files: File[], kind: MediaKind = 'image') {
    const currentCount = useMediaStore.getState().itemMap.size;
    const remaining = MAX_IMAGES - currentCount;
    if (remaining <= 0) return;

    const uploadSessionId = useMediaStore.getState().uploadSessionId;
    if (!uploadSessionId) {
      toast.warning(ERROR_MESSAGES.upload.preparingUpload);
      return;
    }

    const capped = files.slice(0, remaining);

    // Cancel in-flight validation before starting a new batch.
    validationController.current?.abort();
    const controller = new AbortController();
    validationController.current = controller;

    setIsValidating(true);

    let result;
    try {
      result = await validateBatch(capped, kind, controller.signal);
    } catch {
      if (!controller.signal.aborted) {
        setIsValidating(false);
      }
      return;
    }

    if (controller.signal.aborted) {
      return;
    }
    setIsValidating(false);

    const { valid, rejected } = result;

    if (rejected.length > 0) {
      const groups = new Map<string, number>();
      for (const r of rejected) {
        groups.set(r.reason, (groups.get(r.reason) || 0) + 1);
      }

      for (const [reason, count] of groups.entries()) {
        toast.warning(reason, {
          description: `${count} فایل نادیده گرفته شد`,
          position: 'top-center',
        });
      }
    }

    if (valid.length === 0) return;

    const items = valid.map((f) => buildMediaItem(f, kind, true));
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
        const formattedMediaId = extractMediaId(item.uploadedUrl, id);
        void http.delete(
          `/upload-sessions/${uploadSessionId}/photos/${formattedMediaId}`,
        );
      }
    }
  }

  /** Clears the cached session so the next post starts with a fresh one. */
  function resetSession() {
    queryClient.removeQueries({ queryKey: queryKeys.posts.uploadSession() });
  }

  return {
    addFiles,
    cancelUpload,
    removeItem,
    retryUpload,
    resetSession,
    isValidating,
    isSessionLoading: uploadSession.isPending,
  };
}
