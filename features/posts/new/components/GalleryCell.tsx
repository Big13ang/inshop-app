'use client';

import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useMediaStore } from '../services/mediaStore';
import StatusOverlay from './StatusOverlay';

interface GalleryCellProps {
  id: string;
  selectionIndex: number;
  onToggle: () => void;
}

export default function GalleryCell({ id, selectionIndex, onToggle }: GalleryCellProps) {
  const item = useMediaStore((s) =>
    s.mediaList.find((it) => it.id === id)
  );

  if (!item) return null;

  const isSelected = selectionIndex !== -1;

  const handleCellClick = () => {
    if (item.status === 'uploaded') {
      onToggle();
    }
  };

  return (
    <div
      onClick={handleCellClick}
      data-status={item.status}
      data-selected={isSelected}
      className={cn(
        'aspect-square relative rounded-2xl overflow-hidden cursor-pointer select-none',
        'transition-transform duration-75 ease-in-out active:scale-[0.91]'
      )}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          className="w-full h-full object-cover pointer-events-none"
          alt=""
          referrerPolicy="no-referrer"
        />
      ) : null}

      <StatusOverlay item={item} />

      {/* Selection tint for uploaded items */}
      {isSelected && item.status === 'uploaded' ? (
        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
      ) : null}

      {/* Inset border */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl pointer-events-none z-30',
          isSelected ? 'border-2 border-primary' : 'border border-primary/10'
        )}
      />

      {/* Order badge */}
      <div className="absolute top-1.5 right-1.5 z-20">
        {isSelected ? (
          <div className="w-5.5 h-5.5 rounded-full bg-primary text-on-primary border border-white/80 flex items-center justify-center text-[10px] font-black shadow-sm">
            {selectionIndex + 1}
          </div>
        ) : (
          <div className="w-5.5 h-5.5 rounded-full bg-black/35 border border-white/70 flex items-center justify-center" />
        )}
      </div>
    </div>
  );
}

