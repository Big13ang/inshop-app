const shimmer = 'animate-pulse rounded-input bg-container-base';

/** Prerendered placeholder for the profile shell while the seller's data streams in. */
export function ProfileOverviewSkeleton() {
  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <div className="h-16 w-full shrink-0 border-b border-primary/5 bg-surface-l3" />

      <div className="flex-1 overflow-hidden px-4 pt-5">
        <div className="flex items-end justify-between gap-3">
          <div className={`size-20 rounded-pill ${shimmer}`} />
          <div className="flex flex-1 justify-around">
            <div className={`h-8 w-12 ${shimmer}`} />
            <div className={`h-8 w-12 ${shimmer}`} />
            <div className={`h-8 w-12 ${shimmer}`} />
          </div>
        </div>

        <div className={`mt-4 h-5 w-40 ${shimmer}`} />
        <div className={`mt-3 h-4 w-full ${shimmer}`} />
        <div className={`mt-2 h-4 w-3/4 ${shimmer}`} />
        <div className={`mt-4 h-11 w-full ${shimmer}`} />

        <div className="mt-4 grid grid-cols-3 gap-0.5">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-square w-full animate-pulse bg-container-base" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileEditSkeleton() {
  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <div className="h-16 w-full shrink-0 border-b border-primary/5 bg-surface-l3" />

      <div className="flex-1 space-y-6 px-4 pt-4">
        <div className="flex justify-center">
          <div className={`size-24 rounded-pill ${shimmer}`} />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`h-32 w-full rounded-panel ${shimmer}`} />
        ))}
      </div>
    </div>
  );
}
