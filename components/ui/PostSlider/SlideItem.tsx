import React from 'react';
import { cn } from '@/lib/utils';
import type { MediaItem } from './types';
import { slideContainer, slideMedia } from './utils';
import Image from 'next/image';

export function SlideItem({
  item,
  idx,
  isSlideLoaded,
  isMediaLoaded,
  objectFit,
  onMediaLoaded,
}: {
  item: MediaItem;
  idx: number;
  isSlideLoaded: boolean;
  isMediaLoaded: boolean;
  objectFit: 'cover' | 'contain';
  onMediaLoaded: (index: number) => void;
}) {
  const mediaClass = cn(slideMedia({ objectFit, loaded: isMediaLoaded }));

  return (
    <div
      className={slideContainer({ objectFit })}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 400px',
      } as React.CSSProperties}
      id={`slide-${idx}`}
    >
      {isSlideLoaded && item.type === 'video' && (
        <video
          src={item.url}
          autoPlay
          controls
          playsInline
          loop
          muted
          className={mediaClass}
          id={`slide-video-${idx}`}
          onLoadedData={() => onMediaLoaded(idx)}
        />
      )}

      {isSlideLoaded && item.type !== 'video' && (
        <Image
          src={item.url}
          alt={`Product showcase ${idx + 1}`}
          className={mediaClass}
          id={`slide-img-${idx}`}
          onLoad={() => onMediaLoaded(idx)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}

      {(!isSlideLoaded || !isMediaLoaded) && (
        <div
          className="absolute inset-0 bg-neutral-200 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] animate-shimmer"
          id={`slide-skeleton-${idx}`}
        />
      )}
    </div>
  );
}
