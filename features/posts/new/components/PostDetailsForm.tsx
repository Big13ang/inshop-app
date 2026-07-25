'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SelectedMediaSlider from './SelectedMediaSlider';
import { Textarea } from '@/components/ui/textarea';
import { text } from '../constants';

interface PostDetailsFormProps {
  caption: string;
  onCaptionChange: (text: string) => void;
  hasInputError: boolean;
  errorMessage?: string;
  aspectClassName?: string;
}

export default function PostDetailsForm({
  caption,
  onCaptionChange,
  hasInputError,
  errorMessage,
  aspectClassName = 'aspect-square',
}: PostDetailsFormProps) {
  const [isDirty, setIsDirty] = useState(false);
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsDirty(true);
    onCaptionChange(e.target.value);
  };

  const handleTextareaBlur = () => {
    setIsDirty(true);
  };

  const isErrorVisible = isDirty && hasInputError;

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
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          placeholder={text.captionPlaceholder}
          rows={5}
          isError={isErrorVisible}
          errorMessage={errorMessage ?? text.captionError}
          helperText={text.captionHelperText}
        />
      </div>
    </div>
  );
}
