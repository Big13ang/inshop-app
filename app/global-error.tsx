"use client";

import { useEffect } from "react";
import { RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/telemetry/errorTracking";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    captureError(error, {
      domain: "ui",
      action: "render_crash",
      isCritical: true,
      level: "fatal",
      extra: {
        digest: error.digest,
        source: "app/global-error.tsx",
      },
    });
  }, [error]);

  const handleGoHome = () => {
    window.location.assign(window.location.origin);
  };

  return (
    <html
      lang="FA-IR"
      dir="rtl"
      className="overflow-hidden w-full max-w-full"
      suppressHydrationWarning
    >
      <body className="flex flex-col overflow-hidden w-full max-w-full md:items-center bg-background text-foreground h-screen">
        <div className="safe-area h-full w-full max-w-full md:max-w-app md:shadow-app-shell overflow-x-hidden">
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

                {/* Main 500 error text with tight tracking */}
                <h1 className="text-8xl font-black font-logo tracking-tighter text-black select-none leading-none">
                  500
                </h1>

                <div className="px-3 py-1 bg-zinc-950 text-white rounded-full text-[10px] font-extrabold tracking-wider uppercase select-none">
                  Application Error
                </div>
              </div>

              {/* Localized Persian message */}
              <div className="flex flex-col gap-2 mt-2">
                <h2 className="text-xl font-black text-black">
                  مشکلی در اجرای برنامه پیش آمده است
                </h2>
                <p className="text-xs text-zinc-800 font-medium leading-relaxed px-4">
                  متأسفانه خطایی در عملکرد برنامه رخ داد. این خطا به طور خودکار به تیم فنی ارسال شد.
                </p>
              </div>
            </div>

            {/* Action buttons at the bottom */}
            <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center gap-4 mt-auto">
              <Button
                id="btn-retry-global-error"
                variant="filled"
                size="xl"
                className="w-full flex items-center justify-center gap-2"
                onClick={reset}
              >
                <RotateCcw className="size-4" strokeWidth={2} />
                تلاش مجدد
              </Button>

              <button
                type="button"
                id="link-home-global-error"
                onClick={handleGoHome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-black transition-colors py-2 cursor-pointer underline underline-offset-4"
              >
                <Home className="size-3.5" strokeWidth={2} />
                <span>صفحه اصلی</span>
              </button>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
