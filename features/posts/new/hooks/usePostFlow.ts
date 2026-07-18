'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMediaStore } from '../services/mediaStore';
import { extractMediaId } from '@/lib/utils';
import { useMediaUpload } from './useMediaUpload';
import { postsQueryService } from '../../services/postsQueryService';
import { text } from '../constants';
import { ERROR_MESSAGES } from '@/lib/constants/errors';


export type PostFlowNavigationIntent = 'back' | 'pending-posts';

export function usePostFlow(onNavigate: (intent: PostFlowNavigationIntent) => void) {
  const [phase, setPhase] = useState<'select' | 'details'>('select');
  const [caption, setCaption] = useState('');

  const media = useMediaUpload();
  const selectedIds = useMediaStore((s) => s.selectedIds);
  const isUploadPending = useMediaStore((s) =>
    Array.from(s.itemMap.values()).some(
      (it) => it.status === 'queued' || it.status === 'uploading',
    ),
  );

  useMediaStore((s) => s.uploadSessionId);

  const submitPost = postsQueryService.useSubmitPost(() => {
    toast.success(text.uploadSuccessTitle, {
      description: text.uploadSuccessDesc,
    });
    setPhase('select');
    setCaption('');
    media.resetSession();
    useMediaStore.getState().reset();
    onNavigate('pending-posts');
  });

  function handleBack() {
    if (phase === 'details') { setPhase('select'); return; }
    onNavigate('back');
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

    const uploadSessionId = useMediaStore.getState().uploadSessionId;
    if (!uploadSessionId) {
      toast.warning(ERROR_MESSAGES.upload.sessionInvalid);
      return;
    }

    const mediaIds = selectedIds.map((id) => {
      const url = itemMap.get(id)?.uploadedUrl;
      return extractMediaId(url, id);
    });

    submitPost.mutate({
      uploadSessionId,
      description: caption,
      mediaIds,
    });
  }

  return {
    phase,
    caption,
    setCaption,
    media,
    isUploadPending,
    isSubmitting: submitPost.isPending,
    isSessionLoading: media.isSessionLoading,
    isValidating: media.isValidating,
    handleBack,
    handleNext,
  };
}
