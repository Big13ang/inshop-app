'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import { useUpdatePostDescription } from '@/features/post-edit/services/postEditService';

export function PostEditFooter({ postId }: { postId: string }) {
  const router = useRouter();
  const caption = useMediaStore((s) => s.caption);
  const { mutate: saveDescription, isPending: isSaving } = useUpdatePostDescription(postId);

  function handleSaved() {
    toast.success('تغییرات ذخیره شد. پست برای بررسی دوباره ارسال شد.');
    router.push('/app/posts/pending');
  }

  function handleSaveFailed() {
    toast.error('ذخیره تغییرات انجام نشد. دوباره تلاش کنید.');
  }

  function handleSave() {
    saveDescription(caption, { onSuccess: handleSaved, onError: handleSaveFailed });
  }

  function handleBack() {
    router.back();
  }

  const saveDisabled = !caption.trim() || isSaving;

  return (
    <Footer.Root className="flex items-center gap-3">
      <Footer.Button
        id="btn-save-post-edit"
        onClick={handleSave}
        disabled={saveDisabled}
        variant="primary"
        className="flex-1"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span className="leading-none flex items-center font-bold">ذخیره</span>
        )}
      </Footer.Button>
      <Footer.Button
        id="btn-back-post-edit"
        onClick={handleBack}
        disabled={isSaving}
        variant="outline"
        className="flex-1"
      >
        <span className="leading-none">بازگشت</span>
      </Footer.Button>
    </Footer.Root>
  );
}
