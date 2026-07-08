'use client';

import Link from 'next/link';
import { Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="relative flex-1 flex flex-col justify-between h-full px-6 py-12 select-none overflow-hidden bg-background text-foreground">
      {/* Top spacing to push content down */}
      <div className="h-12" />

      {/* Center content container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-6">
        <div className="flex flex-col items-center gap-4">
          {/* Brand Logo in the foreground center */}
          <span className="font-logo font-extrabold text-5xl text-black select-none">
            inShop
          </span>

          {/* Main 404 error text with tight tracking */}
          <h1 className="text-8xl font-black font-logo tracking-tighter text-black select-none leading-none">
            404
          </h1>

          <div className="px-3 py-1 bg-zinc-950 text-white rounded-full text-[10px] font-extrabold tracking-wider uppercase select-none">
            Page Not Found
          </div>
        </div>

        {/* Localized Persian message */}
        <div className="flex flex-col gap-2 mt-2">
          <h2 className="text-xl font-black text-black">
            صفحه مورد نظر در اپلیکیشن وجود ندارد
          </h2>
          <p className="text-xs text-zinc-800 font-medium leading-relaxed px-4">
            ممکن است آدرس را اشتباه وارد کرده باشید یا این صفحه به مکان دیگری منتقل شده باشد.
          </p>
        </div>
      </div>

      {/* Action buttons at the bottom */}
      <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center gap-4 mt-auto">
        <Link href="/auth/login" className="w-full">
          <Button
            id="btn-login-404"
            variant="filled"
            size="xl"
            className="w-full flex items-center justify-center gap-2"
          >
            <LogIn className="size-4" strokeWidth={2} />
            ورود به حساب
          </Button>
        </Link>

        <Link
          id="link-home-404"
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-black transition-colors py-2 cursor-pointer underline underline-offset-4"
        >
          <Home className="size-3.5" strokeWidth={2} />
          <span>صفحه اصلی</span>
        </Link>
      </div>
    </main>
  );
}
