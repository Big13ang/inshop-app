import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SearchEmptyStateProps {
  title?: string;
  description?: string;
  query?: string;
  actionLabel?: string;
  onAction?: () => void;
  id?: string;
}

export function SearchEmptyState({
  title = 'محصولی یافت نشد',
  description,
  query,
  actionLabel,
  onAction,
  id = 'search-empty-state',
}: SearchEmptyStateProps) {
  const desc =
    description ||
    (query ? `هیچ موردی متناسب با «${query}» پیدا نشد.` : 'موردی برای نمایش وجود ندارد.');

  return (
    <div
      id={id}
      className="py-16 px-6 flex flex-col items-center justify-center text-center select-none"
      dir="rtl"
    >
      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 border border-zinc-200/60">
        <Compass className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
      </div>

      <h3 className="font-bold text-zinc-900 text-sm mb-1.5 font-sans">
        {title}
      </h3>

      <p className="text-zinc-500 text-xs leading-5 max-w-[260px] mb-5">
        {desc}
      </p>

      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          size="sm"
          className="bg-zinc-900 hover:bg-black text-white font-semibold text-xs px-5 py-2 rounded-full shadow-xs"
          id={`${id}-btn`}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
