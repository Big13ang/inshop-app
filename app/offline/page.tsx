import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { HomeIcon } from '@/components/icons/HomeIcon';
import AppLogo from '@/components/ui/AppLogo';
import { constructMetadata } from '@/lib/utils/metadata';
import { OfflineRetryButton } from './OfflineRetryButton';

export const metadata: Metadata = constructMetadata({
  title: 'ارتباط با اینترنت برقرار نیست',
  description: 'ارتباط شما با اینترنت قطع شده است. برای مشاهده بخش‌های جدید، لطفاً اتصال شبکه خود را بررسی کنید.',
  noIndex: true,
});

export default async function OfflinePage() {
  'use cache';
  cacheLife('max');

  return (
    <main className="relative flex-1 flex flex-col justify-between h-full px-6 py-12 select-none overflow-hidden bg-background text-foreground">
      {/* Top spacing to push content down */}
      <div className="h-12" />

      {/* Center content container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-6">
        <div className="flex flex-col items-center gap-4">
          {/* Brand Logo in the foreground center */}
          <AppLogo />

          {/* Main Offline text with tight tracking */}
          <h1 className="text-7xl sm:text-8xl font-black font-sans tracking-tighter text-black select-none leading-none">
            Offline
          </h1>

          <div className="px-3 py-1 bg-zinc-950 text-white rounded-full text-[10px] font-extrabold tracking-wider uppercase select-none">
            Offline Mode
          </div>
        </div>

        {/* Localized Persian message */}
        <div className="flex flex-col gap-2 mt-2">
          <h2 className="text-xl font-black text-black">
            ارتباط با اینترنت برقرار نیست
          </h2>
          <p className="text-xs text-zinc-800 font-medium leading-relaxed px-4">
            به نظر می‌رسد ارتباط اینترنتی شما قطع شده است. برای مشاهده بخش‌های جدید، لطفاً اتصال شبکه خود را بررسی کنید.
          </p>
        </div>
      </div>

      {/* Action buttons at the bottom */}
      <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center gap-4 mt-auto">
        <OfflineRetryButton />

        <Link
          id="link-home-offline"
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-black transition-colors py-2 cursor-pointer underline underline-offset-4"
        >
          <HomeIcon className="size-3.5" />
          <span>صفحه اصلی</span>
        </Link>
      </div>
    </main>
  );
}
