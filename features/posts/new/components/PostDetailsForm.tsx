'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SelectedMediaSlider from './SelectedMediaSlider';
import { Textarea } from '@/components/ui/textarea';
import { text } from '../constants';

interface PostDetailsFormProps {
  caption: string;
  onCaptionChange: (text: string) => void;
  hasInputError: boolean;
  aspectClassName?: string;
}

export default function PostDetailsForm({
  caption,
  onCaptionChange,
  hasInputError,
  aspectClassName = 'aspect-square',
}: PostDetailsFormProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, scale: 0.99 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={formRef}
      id="add-post-details-form"
      style={{ contentVisibility: 'auto' }}
      className="p-4 flex flex-col gap-5"
    >
      {/* SelectedMediaSlider reads selected items from the store directly */}
      <SelectedMediaSlider isCompact aspectClassName={aspectClassName} />

      <div className="flex flex-col gap-2">
        <label htmlFor="caption-textarea-input" className="font-bold text-xs text-secondary cursor-pointer pr-1">
          {text.captionLabel}
        </label>

        <Textarea
          id="caption-textarea-input"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder={text.captionPlaceholder}
          rows={5}
          isError={hasInputError}
          errorMessage={text.captionError}
        />
      </div>
    </div>
  );
}
