'use client';

import React from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { useShallow } from 'zustand/react/shallow';
import PostSlider from '@/components/ui/PostSlider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaStore } from '../services/mediaStore';

const HOISTED_REMOVE_ICON = <Trash2 className="w-4 h-4" />;

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
  const activeIdx = useMediaStore((s) => s.activePreviewIdx);

  // Select stable MediaItem references first and apply useShallow to prevent
  // unnecessary re-renders when other items' upload progress updates.
  const selectedItems = useMediaStore(
    useShallow((s) =>
      s.selectedIds
        .map((id) => s.itemMap.get(id))
        .filter((it): it is NonNullable<typeof it> => !!it)
    )
  );

  const media = selectedItems.map((it) => ({
    url: it.uploadedUrl ?? it.localUrl,
    type: it.mediaKind as 'image',
  }));

  function handleActiveChange(idx: number) {
    useMediaStore.setState({ activePreviewIdx: idx });
  }

  function handleRemove(idx: number) {
    const { selectedIds, toggleSelected } = useMediaStore.getState();
    const id = selectedIds[idx];
    if (id) toggleSelected(id);
  }

  if (media.length === 0) {
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
          media={media}
          activeSlide={activeIdx}
          onSlideChange={handleActiveChange}
          objectFit="contain"
        />

        <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 z-[25]">
          <span>فایل {activeIdx + 1} از {media.length}</span>
        </div>

         {!isCompact && media.length > 1 ? (
          <Button
            onClick={(e) => { e.stopPropagation(); handleRemove(activeIdx); }}
            variant="filled"
            shape="circle"
            className="absolute top-4 left-4 bg-zinc-900/90 text-zinc-300 hover:text-white size-8 flex items-center justify-center hover:bg-zinc-950 transition-all border border-white/15 z-[25] p-0 min-w-0"
            title="حذف از انتخاب شده‌ها"
          >
            {HOISTED_REMOVE_ICON}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
