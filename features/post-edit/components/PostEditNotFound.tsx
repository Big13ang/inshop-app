import Link from 'next/link';
import { HomeIcon } from '@/components/icons/HomeIcon';
import { Button } from '@/components/ui/button';
import { PostEditHeader } from './PostEditHeader';

export function PostEditNotFound() {
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <PostEditHeader />

      <main className="relative flex-1 flex flex-col justify-between h-full px-6 py-12 select-none overflow-hidden bg-background text-foreground" dir="rtl">
        <div className="h-6" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-6">
          <div className="flex flex-col items-center gap-4">
            <span className="font-logo font-extrabold text-5xl text-black select-none">
              inShop
            </span>

            <h1 className="text-7xl font-black font-logo tracking-tighter text-black select-none leading-none">
              404
            </h1>

            <div className="px-3 py-1 bg-zinc-950 text-white rounded-full text-[10px] font-extrabold tracking-wider uppercase select-none">
              POST NOT FOUND
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-xl font-black text-black">
              پست مورد نظر وجود ندارد
            </h2>
            <p className="text-xs text-zinc-800 font-medium leading-relaxed px-4">
              ممکن است این پست حذف شده باشد، متعلق به حساب شما نباشد، یا آدرس آن را به اشتباه وارد کرده باشید.
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center gap-4 mt-auto">
          <Link href="/" className="w-full" prefetch={false}>
            <Button
              id="btn-home-post-edit-not-found"
              variant="filled"
              size="xl"
              className="w-full flex items-center justify-center gap-2"
            >
              <HomeIcon className="size-4" />
              صفحه اصلی
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
