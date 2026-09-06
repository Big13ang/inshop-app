const SKELETON_ITEMS = [1, 2, 3, 4];

export function AccountsSkeleton() {
  return (
    <div
      className="px-4 py-2 w-full flex flex-col gap-1.5 select-none"
      id="inshop-accounts-shimmer-skeleton"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="در حال بارگذاری حساب‌های کاربری مرتبط"
    >
      <span className="sr-only">در حال بارگذاری حساب‌های مرتبط...</span>
      {SKELETON_ITEMS.map((idx) => (
        <div key={idx} className="flex items-center gap-3 py-2 px-1 text-right">
          {/* Avatar shimmer */}
          <div className="w-11 h-11 rounded-full bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer shrink-0" />

          {/* Text rows shimmer */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            <div className="h-3.5 w-28 rounded-md bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer" />
            <div className="h-2.5 w-44 rounded-md bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
