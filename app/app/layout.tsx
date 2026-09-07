'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RotateCcw, WifiOff } from 'lucide-react';
import { useUser } from '@/features/profile/context/UserContext';
import { getLoginUrlWithCallback } from '@/lib/utils/navigation';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isVerifying, isRetryableError, refetch } = useUser();

  useEffect(() => {
    // Wait for the client-side /me refetch to settle before redirecting.
    // Only redirect to login if verification has completed, the user is definitely
    // unauthenticated (401 / null user), and NOT in a transient retryable error state (5xx / network).
    if (!isVerifying && !isLoggedIn && !isRetryableError) {
      router.replace(getLoginUrlWithCallback(pathname));
    }
  }, [isLoggedIn, isVerifying, isRetryableError, pathname, router]);

  // If a server or network error occurred during initial verification and there is no cached session,
  // show a retry screen instead of redirecting to login.
  if (isRetryableError && !isLoggedIn) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 select-none bg-background text-foreground text-center">
        <div className="flex flex-col items-center max-w-sm mx-auto gap-5">
          <div className="flex items-center justify-center size-16 rounded-full bg-container-base text-muted-foreground">
            <WifiOff className="size-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-bold text-foreground">
              خطا در برقراری ارتباط با سرور
            </h1>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              ارتباط با سرور برقرار نشد. لطفاً چند لحظه بعد مجدداً تلاش کنید.
            </p>
          </div>

          <Button
            id="btn-retry-auth"
            variant="filled"
            size="lg"
            className="w-full flex items-center justify-center gap-2 mt-2"
            onClick={refetch}
          >
            <RotateCcw className="size-4" />
            <span>تلاش مجدد</span>
          </Button>
        </div>
      </main>
    );
  }

  return children;
}
