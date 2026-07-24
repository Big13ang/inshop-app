'use client';

import Footer from '@/components/layout/Footer';
import { ChevronRight, Plus, Loader2 } from 'lucide-react';
import { MAX_IMAGES, text } from '../constants';
import { useMediaStore } from '../services/mediaStore';

interface SelectPhaseFooterProps {
  isSessionLoading: boolean;
  onTriggerPicker: () => void;
}

const PENDING_STATS = new Set(['queued', 'uploading', 'pending']);

export default function SelectPhaseFooter({
  isSessionLoading,
  onTriggerPicker,
}: SelectPhaseFooterProps) {
  const setPhase = useMediaStore((s) => s.setPhase);
  const isValidating = useMediaStore((s) => s.isValidating);
  const isAtLimit = useMediaStore((s) => s.mediaList.length >= MAX_IMAGES);
  const isPending = useMediaStore((s) =>
    s.mediaList.some((m) => PENDING_STATS.has(m.status)),
  );

  const handleGoToDetails = () => {
    if (isPending) return;
    setPhase('details');
  };

  return (
    <Footer.Root className="flex items-center gap-3">
      <Footer.Button
        id="btn-next-step"
        onClick={handleGoToDetails}
        disabled={isPending || isSessionLoading || isValidating}
        variant="primary"
        className="flex-1"
      >
        {isPending || isValidating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronRight className="w-4 h-4 text-on-primary" strokeWidth={2.5} />
        )}
        <span className="leading-none">{text.nextButton}</span>
      </Footer.Button>
      <Footer.Button
        id="btn-trigger-picker"
        onClick={onTriggerPicker}
        disabled={isAtLimit || isSessionLoading || isValidating}
        variant="outline"
        className="flex-1"
      >
        <Plus className="w-4 h-4 text-primary" strokeWidth={2.5} />
        <span className="leading-none">{text.addButton}</span>
      </Footer.Button>
    </Footer.Root>
  );
}
