import Header from '@/components/layout/Header';
import MainFooter from '@/components/layout/MainFooter';
import { cn } from '@/lib/utils';

const cnWithShimmer = (...inputs: Parameters<typeof cn>) =>
  cn('animate-pulse rounded-input bg-container-base', ...inputs);

export default function PublicPostSkeleton() {
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="public-post-back-btn" />
        <Header.Title>پست</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="flex flex-col">
          {/* Header row skeleton: Avatar + Author Info */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={cnWithShimmer('size-10 rounded-pill')} />
              <div className="flex flex-col gap-2">
                <div className={cnWithShimmer('h-4 w-28')} />
                <div className={cnWithShimmer('h-3 w-16')} />
              </div>
            </div>
          </div>

          {/* Media placeholder */}
          <div className={cnWithShimmer('aspect-square w-full')} />

          {/* Caption placeholder */}
          <div className="flex flex-col gap-2 p-4">
            <div className={cnWithShimmer('h-4 w-32')} />
            <div className={cnWithShimmer('h-4 w-3/4')} />
            <div className={cnWithShimmer('h-4 w-1/2')} />
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
