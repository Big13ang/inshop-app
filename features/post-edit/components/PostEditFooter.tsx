'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';
import { goBackSafely } from '@/lib/utils/navigation';
import { PROFILE_ROUTES } from '@/features/profile/constants';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import { useReplacePostCategories, useUpdatePostDescription } from '@/features/post-edit/services/postEditService';

interface PostEditFooterProps {
  postId: string;
  // The category the post had when the page loaded; '' when it had none.
  savedCategoryId: string;
}

export function PostEditFooter({ postId, savedCategoryId }: PostEditFooterProps) {
  const router = useRouter();
  const caption = useMediaStore((s) => s.caption);
  const category = useMediaStore((s) => s.category);
  const { mutate: saveDescription, isPending: isSavingDescription } = useUpdatePostDescription(postId);
  const { mutate: saveCategory, isPending: isSavingCategory } = useReplacePostCategories(postId);

  const isSaving = isSavingDescription || isSavingCategory;
  // The picker cannot clear a category, so an empty value means "left as it was".
  const hasNewCategory = category !== '' && category !== savedCategoryId;

  function handleSaved() {
    toast.success('تغییرات ذخیره شد. پست برای بررسی دوباره ارسال شد.');
    goBackSafely(router, PROFILE_ROUTES.overview);
  }

  function handleSaveFailed() {
    toast.error('ذخیره تغییرات انجام نشد. دوباره تلاش کنید.');
  }

  function handleCategoryFailed() {
    toast.error('توضیحات ذخیره شد اما تغییر دسته‌بندی انجام نشد. دوباره تلاش کنید.');
  }

  function handleDescriptionSaved() {
    if (!hasNewCategory) {
      handleSaved();
      return;
    }
    saveCategory([category], { onSuccess: handleSaved, onError: handleCategoryFailed });
  }

  function handleSave() {
    saveDescription(caption, { onSuccess: handleDescriptionSaved, onError: handleSaveFailed });
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
