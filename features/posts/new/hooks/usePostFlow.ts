'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMediaStore } from '../services/mediaStore';
import { useMediaUpload } from './useMediaUpload';
import { useSubmitPost } from './useSubmitPost';
import { text } from '../constants';

export function usePostFlow(onNavigate: (view: string) => void) {
  const [phase, setPhase] = useState<'select' | 'details'>('select');
  const [caption, setCaption] = useState('');

  const media = useMediaUpload();
  const selectedIds = useMediaStore((s) => s.selectedIds);
  const isUploadPending = useMediaStore((s) =>
    Array.from(s.itemMap.values()).some(
      (it) => it.status === 'queued' || it.status === 'uploading',
    ),
  );

  const navigateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(navigateTimer.current), []);

  const submitPost = useSubmitPost(() => {
    toast.success(text.uploadSuccessTitle, {
      description: text.uploadSuccessDesc,
      duration: 30000,
    });
    navigateTimer.current = setTimeout(() => onNavigate('pending-posts'), 30000);
  });

  function handleBack() {
    if (phase === 'details') { setPhase('select'); return; }
    onNavigate('pending-posts');
  }

  function handleNext() {
    if (phase === 'select') {
      if (isUploadPending) {
        toast.warning(text.alertUploadsInProgress);
        return;
      }
      if (selectedIds.length === 0) {
        toast.warning(text.alertNoImages);
        return;
      }
      setPhase('details');
      return;
    }

    if (!caption.trim()) {
      toast.warning(text.alertNoCaption);
      return;
    }

    const itemMap = useMediaStore.getState().itemMap;

    const anyPending = selectedIds.some((id) => itemMap.get(id)?.status !== 'uploaded');
    if (anyPending) {
      toast.warning(text.alertUploadsInProgress);
      return;
    }

    const mediaUrls = selectedIds
      .map((id) => itemMap.get(id)?.uploadedUrl)
      .filter((url): url is string => !!url);

    submitPost.mutate({ caption, mediaUrls });
  }

  return {
    phase,
    caption,
    setCaption,
    media,
    isUploadPending,
    isSubmitting: submitPost.isPending,
    handleBack,
    handleNext,
  };
}
