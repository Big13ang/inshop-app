'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';

export interface DeletePostConfirmationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  title?: string;
  description?: string;
}

export function DeletePostConfirmationBottomSheet({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
  title = 'حذف پست',
  description = 'آیا از حذف این پست اطمینان دارید؟ این عمل قابل بازگشت نیست.',
}: DeletePostConfirmationBottomSheetProps) {
  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content variant="drawer" className="p-5 text-right font-sans">
          <div id="delete-post-confirmation-modal" dir="rtl">
            <div className="flex items-center justify-center gap-2.5 pt-1 pb-4 border-b border-container-base mb-4">
              <h3 className="text-sm font-bold text-foreground text-center">
                {title}
              </h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed mb-6 font-medium text-center">
              {description}
            </p>

            <div className="flex items-center gap-3 w-full">
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                variant="destructive"
                className="flex-1 bg-error hover:bg-error/90 text-white font-bold text-xs py-3.5 px-4 h-auto rounded-xl cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                id="delete-post-confirm-btn"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Trash2 className="w-4 h-4 text-white" />
                )}
                <span className="text-white">تایید حذف</span>
              </Button>

              <Button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                variant="outline"
                className="flex-1 bg-transparent hover:bg-container-base text-foreground font-bold text-xs py-3.5 px-4 h-auto rounded-xl border border-outline cursor-pointer active:scale-98 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                id="delete-post-cancel-btn"
              >
                انصراف
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default DeletePostConfirmationBottomSheet;
