'use client';

import React from 'react';
import { useMediaStore } from '../services/mediaStore';
import StatusOverlay from './StatusOverlay';

interface GalleryCellProps {
  id: string;
  selectionIndex: number;  // -1 = not selected
  onToggle: () => void;
  onLongPress?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export default function GalleryCell({ id, selectionIndex, onToggle, onLongPress, onRetry }: GalleryCellProps) {
  // Per-cell subscription — only this cell re-renders on its own progress ticks.
  const item = useMediaStore((s) => s.itemMap.get(id));

  // Hold timer state and refs
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!item) return null;

  const isSelected = selectionIndex !== -1;

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPressRef.current = false;
    // Only trigger on left clicks
    if ('button' in e && e.button !== 0) return;

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress?.(id);
    }, 600);
  };

  const endHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPressRef.current) {
      // Normal click/tap
      if (item.status === 'uploaded') {
        onToggle();
      } else if ((item.status === 'failed' || item.status === 'cancelled') && onRetry) {
        onRetry(id);
      }
    }
  };

  const cancelHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={cancelHold}
      // Temporarily disabled for mobile flicker testing: touch + mouse events can double-toggle selection.
      // onTouchStart={startHold}
      // onTouchEnd={endHold}
      // onTouchMove={cancelHold}
      data-status={item.status}
      data-selected={isSelected}
      className={`aspect-square relative rounded-2xl overflow-hidden cursor-pointer select-none
        transition-transform duration-75 ease-in-out active:scale-[0.91]`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' } as React.CSSProperties}
    >
      {/* Thumbnail — always shows localUrl; swaps to uploadedUrl once available */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.uploadedUrl ?? item.localUrl}
        className="w-full h-full object-cover pointer-events-none"
        alt=""
        referrerPolicy="no-referrer"
      />

      <StatusOverlay item={item} onRetry={onRetry ? () => onRetry(id) : undefined} />

      {/* Selection tint for uploaded items */}
      {isSelected && item.status === 'uploaded' ? (
        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
      ) : null}

      {/* Inset border */}
      <div className={`absolute inset-0 rounded-2xl pointer-events-none z-30
        ${isSelected ? 'border-2 border-primary' : 'border border-primary/10'}`} />

      {/* Order badge */}
      <div className="absolute top-1.5 right-1.5 z-20" onClick={(e) => { e.stopPropagation(); if (item.status === 'uploaded') onToggle(); }}>
        {isSelected ? (
          <div className="w-5.5 h-5.5 rounded-full bg-primary text-on-primary border border-white/80 flex items-center justify-center text-[10px] font-black shadow-sm">
            {selectionIndex + 1}
          </div>
        ) : (
          <div className="w-5.5 h-5.5 rounded-full bg-black/35 border border-white/70 flex items-center justify-center">
            {item.status === 'uploaded' ? null : null}
          </div>
        )}
      </div>
    </div>
  );
}
