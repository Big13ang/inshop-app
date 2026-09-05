import React, { useState } from 'react';
import { cva } from 'class-variance-authority';
import type { PostSliderItem } from './types';
import { slideContainer } from './utils';

const slideSkeleton = cva(
  'absolute inset-0 bg-size-[200%_100%] animate-shimmer z-0 transition-opacity duration-500',
  {
    variants: {
      objectFit: {
        contain: 'bg-neutral-900 bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900',
        cover: 'bg-neutral-200 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200',
      },
      dimmed: {
        true: 'opacity-30',
        false: 'opacity-100',
      },
    },
    defaultVariants: {
      dimmed: false,
    },
  }
);

const slideThumbnail = cva(
  'absolute inset-0 w-full h-full select-none filter blur-xs scale-105 pointer-events-none z-10 transition-opacity duration-700 ease-out',
  {
    variants: {
      objectFit: {
        contain: 'object-contain',
        cover: 'object-cover',
      },
      loaded: {
        true: 'opacity-0',
        false: 'opacity-100',
      },
    },
    defaultVariants: {
      loaded: false,
    },
  }
);

const slideImage = cva(
  'w-full h-full select-none relative z-20',
  {
    variants: {
      objectFit: {
        contain: 'object-contain',
        cover: 'object-cover',
      },
      loaded: {
        true: 'animate-image-reveal opacity-100',
        false: 'opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      loaded: false,
    },
  }
);

export function SlideItem({
  item,
  idx,
  objectFit,
  onImageLoad,
}: {
  item: PostSliderItem;
  idx: number;
  objectFit: 'cover' | 'contain';
  onImageLoad?: (url: string, ratio: number) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!item?.url) {
    return null;
  }

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setIsLoaded(true);
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      onImageLoad?.(item.url, img.naturalWidth / img.naturalHeight);
    }
  }

  function handleImageError() {
    setIsLoaded(true);
  }

  const hasThumbnail = Boolean(item.thumbnailUrl);

  return (
    <div
      className={slideContainer({ objectFit })}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 400px',
      } as React.CSSProperties}
      id={`slide-${idx}`}
    >
      {/* 1. Underlying skeleton shimmer placeholder (underneath both thumbnail and full image) */}
      {!isLoaded && (
        <div
          className={slideSkeleton({ objectFit, dimmed: hasThumbnail })}
          id={`slide-skeleton-${idx}`}
        />
      )}

      {/* 2. Feed thumbnail preview (displays while real full-res image is loading, then dissolves smoothly) */}
      {hasThumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt=""
          aria-hidden="true"
          className={slideThumbnail({ objectFit, loaded: isLoaded })}
          id={`slide-thumb-${idx}`}
        />
      )}

      {/* 3. Real full-resolution image on top with rich entrance reveal animation */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={item.alt || `Product showcase ${idx + 1}`}
        className={slideImage({ objectFit, loaded: isLoaded })}
        id={`slide-img-${idx}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
