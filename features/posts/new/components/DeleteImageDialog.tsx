'use client';

import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';

interface DeleteImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteImageDialog({ isOpen, onClose, onConfirm }: DeleteImageDialogProps) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content variant="drawer" className="pt-2">
          <div className="px-6 pt-4 pb-7 text-center" dir="rtl">
            <h2 className="text-xl font-bold text-foreground leading-snug">حذف تصویر</h2>
            <p className="mt-3 text-[15px] text-secondary leading-relaxed">
              آیا از حذف این تصویر اطمینان دارید؟
            </p>
          </div>

          <div className="flex gap-3 px-6 pb-10" dir="rtl">
            <Button
              id="btn-reject-delete"
              variant="secondary"
              size="xl"
              className="flex-1"
              onClick={onClose}
            >
              انصراف
            </Button>
            <Button
              id="btn-confirm-delete"
              variant="destructive"
              size="xl"
              className="flex-1"
              onClick={onConfirm}
            >
              حذف
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
