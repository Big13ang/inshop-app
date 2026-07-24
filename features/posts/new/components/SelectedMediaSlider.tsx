'use client';

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { useShallow } from 'zustand/react/shallow';
import PostSlider from '@/components/ui/PostSlider';
import { cn } from '@/lib/utils';
import { useMediaStore } from '../services/mediaStore';

import DeleteMediaButton from './DeleteMediaButton';

interface SelectedMediaSliderProps {
  aspectClassName?: string;
  isCompact?: boolean;
}

const sliderContainerVariants = cva(
  'w-full bg-zinc-950 relative overflow-hidden shrink-0',
  {
    variants: {
      state: {
        empty: 'border-b border-zinc-800 flex items-center justify-center',
        compact: 'border border-primary/5 shadow-md',
        default: 'border-b border-zinc-200',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

export default function SelectedMediaSlider({
  aspectClassName = 'aspect-square',
  isCompact = false,
}: SelectedMediaSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const mediaItems = useMediaStore(
    useShallow(s =>
      s.mediaList
        .filter(item => item.order !== null)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(item => ({
          id: item.id,
          url: item.previewUrl!,
        }))
    )
  );

  const mediaList = mediaItems.map(item => ({ url: item.url }));
  const activeMediaId = mediaItems[activeIndex]?.id;

  function handleActiveChange(idx: number) {
    setActiveIndex(idx);
  }

  if (mediaList.length === 0) {
    return (
      <div
        style={{ contentVisibility: 'auto' } as React.CSSProperties}
        className={cn(sliderContainerVariants({ state: 'empty' }), aspectClassName)}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/60">
            <ImageIcon className="w-8 h-8 text-zinc-600" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-zinc-300">تصویری انتخاب نشده</span>
            <p className="text-xs text-zinc-600 leading-5 max-w-[200px] mx-auto">
              پس از آپلود، تصویر را لمس کنید تا به پست اضافه شود
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ contentVisibility: 'auto' } as React.CSSProperties}
      className={cn(
        sliderContainerVariants({ state: isCompact ? 'compact' : 'default' }),
        !isCompact && 'max-h-[50vh]'
      )}
    >
      <div className="w-full relative overflow-hidden bg-zinc-950">
        <PostSlider
          items={mediaList}
          activeSlide={activeIndex}
          onSlideChange={handleActiveChange}
          objectFit="contain"
        />

        <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 z-[25]">
          <span>فایل {activeIndex + 1} از {mediaList.length}</span>
        </div>

        {!isCompact && mediaList.length > 1 && activeMediaId ? (
          <DeleteMediaButton mediaId={activeMediaId} />
        ) : null}
      </div>
    </div>
  );
}

