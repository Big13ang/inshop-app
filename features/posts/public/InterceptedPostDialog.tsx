'use client';

import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';

interface InterceptedPostDialogProps {
  children: React.ReactNode;
}

export function InterceptedPostDialog({ children }: InterceptedPostDialogProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog.Root isOpen onClose={handleClose}>
      <Dialog.Portal>
        <Dialog.Backdrop aria-hidden="true" />
        <Dialog.Content
          variant="fullscreen"
          dragToDismiss={false}
          className="!bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="نمایش پست"
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
