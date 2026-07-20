'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/utils';
import { storageKeys } from '@/lib/constants/storageKeys';

const STORAGE_KEY = storageKeys.localStorage.posts.addPostOnboardingSeen;

function hasSeenOnboarding(): boolean {
  const result = storage.get(STORAGE_KEY);
  return result.ok && result.value === '1';
}

export default function AddPostOnboardingSheet() {
  const [isOpen, setIsOpen] = useState(() => !hasSeenOnboarding());

  function handleClose() {
    storage.set(STORAGE_KEY, '1');
    setIsOpen(false);
  }

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content variant="drawer" className="pt-2">
          <div className="px-6 pt-4 pb-2 text-right" dir="rtl">
            <h2 className="text-xl font-bold text-foreground leading-snug">
              فروشنده گرامی، خوش آمدید.
            </h2>
            <p className="mt-3 text-[15px] text-secondary leading-relaxed">
              برای شروع فروش و فعال شدن پروفایل فروشگاه، اولین محصول خود را ثبت کنید.
            </p>
          </div>

          <div className="px-6 pb-10 pt-4" dir="rtl">
            <Button
              id="add-post-onboarding-got-it"
              variant="primary"
              size="xl"
              className="w-full"
              onClick={handleClose}
            >
              متوجه شدم
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
