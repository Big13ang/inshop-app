'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SubmitPostPayload {
  caption:   string;
  mediaUrls: string[];
}

async function submitPost(payload: SubmitPostPayload): Promise<void> {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

export function useSubmitPost(onSuccess: () => void) {
  return useMutation({
    mutationFn: submitPost,
    onSuccess,
    onError: () => {
      toast.error('ارسال پست با خطا مواجه شد، دوباره تلاش کنید');
    },
  });
}
