import React, { useState, startTransition, useEffect, useRef, useSyncExternalStore } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

import type { PostSliderProps } from './types';
import {
  EMPTY_ARRAY,
  DEFAULT_EASING,
  CONTAINER_CLASSES,
  emptySubscribe,
  normalizeMediaItems,
} from './utils';
import { usePreloadedSlides, useMediaLoaded } from './hooks';
import { SlideItem } from './SlideItem';
import { BulletDots } from './BulletDots';

export type { MediaItem, PostSliderProps } from './types';
export { normalizeMediaItems } from './utils';
export { SlideItem } from './SlideItem';
export { BulletDots } from './BulletDots';

export default function PostSlider({
  images = EMPTY_ARRAY,
  media,
  activeSlide,
  onSlideChange,
  objectFit = 'cover',
}: PostSliderProps) {
  const items = normalizeMediaItems(media ?? images);

  const [currentSlide, setCurrentSlide] = useState(() => activeSlide ?? 0);
  const { loadedIndexes: loadedSlideIndexes, preloadAround, preloadSingle } =
    usePreloadedSlides(items.length);
  const { loadedIndexes: loadedMediaIndexes, markLoaded: handleMediaLoaded } =
    useMediaLoaded();
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const onSlideChangeRef = useRef(onSlideChange);
  useEffect(() => {
    onSlideChangeRef.current = onSlideChange;
  }, [onSlideChange]);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: activeSlide ?? 0,
    mode: 'snap',
    rubberband: true,
    defaultAnimation: {
      duration: 350,
      easing: DEFAULT_EASING,
    },
    dragStarted(slider) {
      preloadAround(slider.track.details.rel);
    },
    animationEnded(slider) {
      const active = slider.track.details.rel;
      startTransition(() => {
        setCurrentSlide(active);
        onSlideChangeRef.current?.(active);
      });
      preloadAround(active);
    },
    created(slider) {
      preloadAround(slider.track.details.rel);
    },
    updated(slider) {
      preloadAround(slider.track.details.rel);
    },
  });

  useEffect(() => {
    instanceRef.current?.update();
  }, [media, images, instanceRef]);

  useEffect(() => {
    if (instanceRef.current && typeof activeSlide === 'number') {
      const current = instanceRef.current.track?.details?.rel;
      if (current !== activeSlide) {
        instanceRef.current.moveToIdx(activeSlide);
      }
    }
  }, [activeSlide, instanceRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!instanceRef.current) return;
    const current = instanceRef.current.track?.details?.rel ?? 0;
    if (e.key === 'ArrowLeft') {
      if (current <= 0) return;
      instanceRef.current.prev();
    } else if (e.key === 'ArrowRight') {
      if (current >= items.length - 1) return;
      instanceRef.current.next();
    }
  };

  if (items.length === 0) return null;

  if (!isHydrated) {
    return (
      <div className={CONTAINER_CLASSES} id="post-slider-container-skeleton">
        <div className="absolute inset-0 bg-neutral-200 animate-shimmer" />
      </div>
    );
  }

  return (
    <div
      className={CONTAINER_CLASSES}
      id="post-slider-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="گالری تصاویر"
    >
      <div ref={sliderRef} className="keen-slider h-full w-full">
        {items.map((item, idx) => (
          <SlideItem
            key={item.url}
            item={item}
            idx={idx}
            isSlideLoaded={loadedSlideIndexes.has(idx)}
            isMediaLoaded={loadedMediaIndexes.has(idx)}
            objectFit={objectFit}
            onMediaLoaded={handleMediaLoaded}
          />
        ))}
      </div>

      <BulletDots
        count={items.length}
        currentSlide={currentSlide}
        onDotClick={(idx) => instanceRef.current?.moveToIdx(idx)}
        onDotHover={preloadSingle}
      />
    </div>
  );
}
