'use client';

import { Loader2 } from 'lucide-react';
import { text } from '../constants';

export default function AddPostLoadingSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-pulse px-4 py-6 gap-6" dir="rtl">
      {/* Main big skeleton for the media slider */}
      <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        {/* Spinner and Message */}
        <div className="flex flex-col items-center gap-3 z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-zinc-500">{text.loadingSession}</p>
        </div>
      </div>

      {/* Selected Gallery Grid skeleton */}
      <div className="flex flex-col select-none mt-2 pb-6">
        <div className="mb-3">
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
