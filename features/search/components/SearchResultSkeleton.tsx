import { AccountsSkeleton } from './AccountsSkeleton';
import { FeedSkeleton } from '@/features/feed/components/FeedSkeleton';

export function SearchResultSkeleton() {
  return (
    <div
      className="w-full flex flex-col select-none"
      id="inshop-search-result-shimmer-skeleton"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="در حال بارگذاری نتایج جستجو و حساب‌های مرتبط"
    >
      <span className="sr-only">در حال جستجو و بارگذاری...</span>
      {/* Top 4 accounts shimmer rows */}
      <AccountsSkeleton />

      {/* Subtle divider */}
      <div className="w-full h-px bg-zinc-100 my-1" />

      {/* 3-Column feed shimmer grid */}
      <FeedSkeleton />
    </div>
  );
}
