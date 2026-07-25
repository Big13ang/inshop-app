'use client';

import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MediaItem, MediaStatus } from '../types';

const STATUS_CONFIG: Record<
  MediaStatus,
  { bg: string; icon?: React.ReactNode; label?: string }
> = {
  queued: { bg: 'bg-black/50', icon: <Clock className="w-4 h-4 text-white" /> },
  pending: { bg: 'bg-black/50', icon: <Clock className="w-4 h-4 text-white" /> },
  uploading: { bg: 'bg-black/25' },
  uploaded: { bg: 'bg-transparent' },
  failed: { bg: 'bg-red-950/60', icon: <RotateCcw className="w-4 h-4 text-red-300" />, label: 'خطا' },
};

interface StatusOverlayProps {
  item: MediaItem;
}

const CIRCLE_RADIUS = 13.5;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~84.82

function getProgressOffset(progressPercent: number): number {
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));
  return CIRCLE_CIRCUMFERENCE - (clampedProgress / 100) * CIRCLE_CIRCUMFERENCE;
}

function renderUploadingProgress(uploadProgress: number) {
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 32 32">
        {/* Background track */}
        <circle
          className="text-white/20"
          strokeWidth="2.5"
          stroke="currentColor"
          fill="transparent"
          r={CIRCLE_RADIUS}
          cx="16"
          cy="16"
        />
        {/* Progress track */}
        <circle
          className="text-white transition-[stroke-dashoffset] duration-150 ease-out"
          strokeWidth="2.5"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={getProgressOffset(uploadProgress)}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={CIRCLE_RADIUS}
          cx="16"
          cy="16"
        />
      </svg>
      <span className="text-[9px] font-black text-white tabular-nums mt-0.5">
        {uploadProgress}٪
      </span>
    </div>
  );
}

function renderRetryButton() {
  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Button
      onClick={handleRetryClick}
      variant="link"
      className="pointer-events-auto mt-1 text-[9px] text-red-300 underline h-auto p-0"
    >
      تلاش دوباره
    </Button>
  );
}

export default function StatusOverlay({ item }: StatusOverlayProps) {
  if (item.status === 'uploaded') return null;

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.queued;
  return (
    <div className={cn('absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none', cfg.bg)}>
      {cfg.icon}
      {cfg.label ? <span className="text-[9px] font-bold text-white mt-1">{cfg.label}</span> : null}

      {item.status === 'uploading' && renderUploadingProgress(item.uploadProgress)}
      {item.status === 'failed' && renderRetryButton()}
    </div>
  );
}


