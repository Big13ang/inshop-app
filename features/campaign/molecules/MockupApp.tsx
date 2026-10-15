'use client';

import { useIdleReady } from '@/features/campaign/hooks/useIdleReady';

export const MockupApp = () => {
  // The preview is a full copy of the app. Mount it only after the landing page has
  // loaded and the browser is idle, so it never competes with the hero for the main thread.
  const isIdle = useIdleReady();

  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      {/* Live inShop home inside a phone frame */}
      <div className="bg-white rounded-[3rem] shadow-2xl border-[8px] border-stone-900 overflow-hidden aspect-[9/19] flex flex-col relative">
        {isIdle ? (
          <iframe
            src="/"
            loading="lazy"
            title="پیش‌نمایش اپلیکیشن inShop"
            tabIndex={-1}
            className="pointer-events-none w-full h-full flex-1 border-0 bg-white"
          />
        ) : (
          <div className="w-full h-full flex-1 bg-stone-50" aria-hidden="true" />
        )}
      </div>

      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[radial-gradient(circle,var(--color-rose-100),transparent_70%)] rounded-full -z-10" />
    </div>
  );
};
