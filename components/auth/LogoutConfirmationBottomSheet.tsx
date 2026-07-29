'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';

export interface LogoutConfirmationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export function LogoutConfirmationBottomSheet({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmationBottomSheetProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { signOut } = useAuthFlow();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const success = await signOut();

    if (success) {
      onClose();
      onConfirm?.();
      startTransition(() => {
        router.replace('/auth/login');
      });
    } else {
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    if (isLoggingOut) return;
    onClose();
  };

  const handleDialogClose = () => {
    if (isLoggingOut) return;
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleDialogClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content variant="drawer" className="p-5 text-right font-sans">
          <div id="logout-confirmation-modal" dir="rtl">
            {/* Header / Title & Icon centered */}
            <div className="flex items-center justify-center gap-2.5 pt-1 pb-4 border-b border-container-base mb-4">
              <h3 className="text-sm font-bold text-foreground">
                خروج از حساب کاربری
              </h3>
            </div>

            {/* Description Body */}
            <p className="text-xs text-secondary leading-relaxed mb-6 font-medium">
              آیا برای خروج از حساب کاربری خود اطمینان دارید؟ برای دسترسی دوباره به فروشگاه و پیام‌ها باید مجدداً وارد شوید.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full">
              {/* Primary Confirm CTA */}
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoggingOut}
                variant="primary"
                className="flex-1 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs py-3.5 px-4 h-auto rounded-xl cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                id="logout-confirm-btn"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 rotate-180" />
                )}
                <span>تایید خروج</span>
              </Button>

              {/* Cancel Button */}
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isLoggingOut}
                variant="outline"
                className="flex-1 bg-transparent hover:bg-container-base text-foreground font-bold text-xs py-3.5 px-4 h-auto rounded-xl border border-outline cursor-pointer active:scale-98 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                id="logout-cancel-btn"
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

export default LogoutConfirmationBottomSheet;
