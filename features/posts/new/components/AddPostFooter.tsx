'use client';

import Footer from '@/components/layout/Footer';
import { ChevronRight, Plus, Loader2 } from 'lucide-react';
import { text } from '../constants';

interface AddPostFooterProps {
  phase: 'select' | 'details';
  caption: string;
  isSubmitting: boolean;
  onNext: () => void;
  onTriggerPicker: () => void;
}

export default function AddPostFooter({ phase, caption, isSubmitting, onNext, onTriggerPicker }: AddPostFooterProps) {
  if (phase === 'details') {
    const shareDisabled = !caption.trim() || isSubmitting;
    return (
      <Footer.Root className="flex items-center gap-3">
        <Footer.Button
          id="btn-share-post"
          onClick={onNext}
          disabled={shareDisabled}
          variant="primary"
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="leading-none flex items-center font-bold">{text.shareButton}</span>
          )}
        </Footer.Button>
      </Footer.Root>
    );
  }

  return (
    <Footer.Root className="flex items-center gap-3">
      <Footer.Button id="btn-next-step" onClick={onNext} variant="primary" className="flex-1">
        <ChevronRight className="w-4 h-4 text-on-primary" strokeWidth={2.5} />
        <span className="leading-none">{text.nextButton}</span>
      </Footer.Button>
      <Footer.Button id="btn-trigger-picker" onClick={onTriggerPicker} variant="outline" className="flex-1">
        <Plus className="w-4 h-4 text-primary" strokeWidth={2.5} />
        <span className="leading-none">{text.addButton}</span>
      </Footer.Button>
    </Footer.Root>
  );
}
