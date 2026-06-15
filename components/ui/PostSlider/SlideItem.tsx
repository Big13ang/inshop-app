import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { MediaItem } from './types';
import { slideContainer } from './utils';

export function SlideItem({
  item,
  idx,
  objectFit,
}: {
  item: MediaItem;
  idx: number;
  objectFit: 'cover' | 'contain';
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={slideContainer({ objectFit })}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 400px',
      } as React.CSSProperties}
      id={`slide-${idx}`}
    >
      {/* 1. Skeleton rendered FIRST (underneath the image) */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-neutral-200 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] animate-shimmer"
          id={`slide-skeleton-${idx}`}
        />
      )}

      {/* 2. Image rendered SECOND (stacked on top with relative z-10) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={`Product showcase ${idx + 1}`}
        className={cn(
          objectFit === 'contain' ? 'object-contain' : 'object-cover',
          'w-full h-full select-none relative z-10'
        )}
        id={`slide-img-${idx}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
