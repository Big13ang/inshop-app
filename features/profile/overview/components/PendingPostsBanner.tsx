'use client';

import { ChevronLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { text } from '../../constants';

interface PendingPostsBannerProps {
  pendingCount: number;
  onNavigate: () => void;
}

export default function PendingPostsBanner({ pendingCount, onNavigate }: PendingPostsBannerProps) {
  if (pendingCount <= 0) return null;

  return (
    <Button
      id="profile-pending-banner"
      variant="secondary"
      onClick={onNavigate}
      dir="rtl"
      className="tap-card mt-4 h-auto w-full justify-between rounded-xl border border-zinc-200 bg-surface-l2 p-3.5 text-right"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-input bg-primary text-on-primary">
          <Clock className="size-4" aria-hidden="true" />
        </span>
        <span className="flex flex-col text-right">
          <span className="text-xs font-bold text-primary">{text.overview.pendingBannerTitle}</span>
          <span className="mt-0.5 text-[10px] font-medium text-secondary">
            {text.overview.pendingBannerSubtitle(pendingCount)}
          </span>
        </span>
      </span>

      <span className="inline-flex items-center gap-1">
        <span className="text-[10px] font-bold leading-none text-primary">{text.overview.pendingBannerAction}</span>
        <ChevronLeft className="size-4 shrink-0 text-primary" aria-hidden="true" />
      </span>
    </Button>
  );
}
