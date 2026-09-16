'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Store } from 'lucide-react';
import { HomeIcon } from '@/components/icons/HomeIcon';
import { Button } from '@/components/ui/button';
import { useSignOutMutation } from '@/features/auth/hooks/useAuthMutations';
import AppLogo from '@/components/ui/AppLogo';
import { text } from '../constants';

export function UnverifiedSellerView() {
  const router = useRouter();
  const signOutMutation = useSignOutMutation();

  const handleLogout = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => router.replace('/auth/login'),
    });
  };

  return (
    <main
      className="relative flex h-full w-full flex-1 flex-col items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground select-none"
      dir="rtl"
    >
      {/* Central Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full mx-auto gap-6">
        <div className="flex flex-col items-center gap-4">
          <AppLogo />

          <div className="flex items-center justify-center size-20 rounded-3xl bg-surface-l1 text-primary border border-primary/10 shadow-sm">
            <Store className="size-9" strokeWidth={1.75} />
          </div>

          <div className="px-3.5 py-1 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-full text-[11px] font-bold tracking-wider select-none">
            {text.unverified.badge}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-extrabold text-primary">
            {text.unverified.title}
          </h1>
          <p className="text-xs text-secondary font-medium leading-relaxed px-4">
            {text.unverified.description}
          </p>
        </div>

        {/* Home Button centered within page content */}
        <div className="w-full max-w-xs pt-2">
          <Link href="/" className="w-full">
            <Button
              id="btn-go-home-unverified"
              variant="filled"
              size="xl"
              className="w-full flex items-center justify-center gap-2 font-bold"
            >
              <HomeIcon className="size-4" />
              <span>{text.unverified.homeAction}</span>
            </Button>
          </Link>

          <Button
            id="btn-logout-unverified"
            type="button"
            variant="outline"
            size="xl"
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
            className="mt-3 w-full flex items-center justify-center gap-2 font-bold"
          >
            {signOutMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4 rotate-180" aria-hidden="true" />
            )}
            <span>{text.unverified.logoutAction}</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
