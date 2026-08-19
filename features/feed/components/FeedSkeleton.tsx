const SKELETON_ITEMS = Array.from({ length: 15 }, (_, i) => i);

export function FeedSkeleton() {
  return (
    <div
      className="w-full bg-white"
      id="feed-skeleton-grid"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="در حال بارگذاری پست‌ها"
    >
      <span className="sr-only">در حال بارگذاری...</span>
      <div className="grid grid-cols-3 gap-0.5 w-full">
        {SKELETON_ITEMS.map((item) => (
          <div
            key={item}
            className="w-full aspect-square bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-pulse"
            id={`skeleton-tile-${item}`}
          />
        ))}
      </div>
    </div>
  );
}

export default FeedSkeleton;
