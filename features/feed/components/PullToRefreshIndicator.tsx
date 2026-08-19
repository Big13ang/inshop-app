'use client';

import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isPullDownActive: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isPullDownActive,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) {
    return null;
  }

  return (
    <div
      className="absolute left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{
        top: '100px',
        transform: `translateY(${Math.min(70, pullDistance - 40)}px)`,
        opacity: Math.min(1, pullDistance / 40),
        transition: isPullDownActive
          ? 'none'
          : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease',
      }}
    >
      <div
        className="w-9 h-9 rounded-full bg-white shadow-md border border-zinc-200 flex items-center justify-center"
        style={{
          transform: `scale(${Math.min(1.1, pullDistance / 50)}) rotate(${pullDistance * 5}deg)`,
          transition: isPullDownActive ? 'none' : 'transform 0.2s ease',
        }}
      >
        <RotateCw
          className={cn('w-4 h-4 text-zinc-900', isRefreshing && 'animate-spin')}
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}

export default PullToRefreshIndicator;
