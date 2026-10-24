import { Button } from '@/components/ui/button';
import { PostEditHeader } from './PostEditHeader';

interface PostEditOfflineProps {
  onRetry: () => void;
}

export function PostEditOffline({ onRetry }: PostEditOfflineProps) {
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <PostEditHeader />

      <main className="relative flex-1 flex flex-col justify-between h-full px-6 py-12 select-none overflow-hidden bg-background text-foreground" dir="rtl">
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-4">
          <h1 className="text-xl font-black text-black">ارتباط با اینترنت برقرار نیست</h1>
          <p className="text-xs text-zinc-800 font-medium leading-relaxed px-4">
            به نظر می‌رسد اتصال شما قطع است. بعد از برقراری اتصال دوباره تلاش کنید.
          </p>
        </div>

        <div className="relative z-10 w-full max-w-xs mx-auto mt-auto">
          <Button
            id="btn-post-edit-retry"
            variant="filled"
            size="xl"
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2"
          >
            تلاش مجدد
          </Button>
        </div>
      </main>
    </div>
  );
}
