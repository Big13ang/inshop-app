'use client';

import React from 'react';
import { X, Clock, RotateCcw } from 'lucide-react';
import type { MediaItem, MediaStatus } from '../types';

const STATUS_CONFIG: Record<
  MediaStatus,
  { bg: string; icon?: React.ReactNode; label?: string }
> = {
  queued: { bg: 'bg-black/50', icon: <Clock className="w-4 h-4 text-white" /> },
  uploading: { bg: 'bg-black/25' },
  uploaded: { bg: 'bg-transparent' },
  cancelled: { bg: 'bg-black/60', icon: <X className="w-4 h-4 text-zinc-300" />, label: 'لغو شد' },
  failed: { bg: 'bg-red-950/60', icon: <RotateCcw className="w-4 h-4 text-red-300" />, label: 'خطا' },
};

interface StatusOverlayProps {
  item: MediaItem;
  onRetry?: () => void;
}

export default function StatusOverlay({ item, onRetry }: StatusOverlayProps) {
  if (item.status === 'uploaded') return null;

  const cfg = STATUS_CONFIG[item.status];
  return (
    <div className={`absolute inset-0 ${cfg.bg} flex flex-col items-center justify-center z-10 pointer-events-none`}>
      {cfg.icon}
      {cfg.label ? <span className="text-[9px] font-bold text-white mt-1">{cfg.label}</span> : null}

      {item.status === 'uploading' ? (
        <div className="relative flex items-center justify-center w-10 h-10">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 32 32">
            {/* Background track */}
            <circle
              className="text-white/20"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
              r="13.5"
              cx="16"
              cy="16"
            />
            {/* Progress track */}
            <circle
              className="text-white transition-[stroke-dashoffset] duration-150 ease-out"
              strokeWidth="2.5"
              strokeDasharray="84.82"
              strokeDashoffset={84.82 - (item.progress / 100) * 84.82}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="13.5"
              cx="16"
              cy="16"
            />
          </svg>
          <span className="text-[9px] font-black text-white tabular-nums mt-0.5">
            {item.progress}٪
          </span>
        </div>
      ) : null}

      {item.status === 'failed' && onRetry ? (
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          className="pointer-events-auto mt-1 text-[9px] text-red-300 underline"
        >
          تلاش دوباره
        </button>
      ) : null}
    </div>
  );
}
