'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMediaStore } from '../services/mediaStore';
import { useMediaUpload } from './useMediaUpload';
import { useSubmitPost } from './useSubmitPost';
import { text } from '../constants';

export function usePostFlow(onNavigate: (view: string) => void) {
  const [phase, setPhase] = useState<'select' | 'details'>('select');
  const [caption, setCaption] = useState('');

  const media = useMediaUpload();
  const itemMap = useMediaStore((s) => s.itemMap);
  const selectedIds = useMediaStore((s) => s.selectedIds);

  const submitPost = useSubmitPost(() => onNavigate('pending-posts'));

  function handleBack() {
    if (phase === 'details') { setPhase('select'); return; }
    onNavigate('pending-posts');
  }

  function handleNext() {
    if (phase === 'select') {
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

    const mediaUrls = selectedIds
      .map((id) => itemMap.get(id)?.uploadedUrl)
      .filter((url): url is string => !!url);

    if (mediaUrls.length < selectedIds.length) {
      toast.warning('لطفاً صبر کنید تا آپلود تصاویر کامل شود');
      return;
    }

    submitPost.mutate({ caption, mediaUrls });
  }

  return {
    phase,
    caption,
    setCaption,
    selectedIds,
    itemMap,
    media,
    isSubmitting: submitPost.isPending,
    handleBack,
    handleNext,
  };
}
