import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
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
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const onSlideChangeRef = useRef(onSlideChange);
  useEffect(() => {
    onSlideChangeRef.current = onSlideChange;
  }, [onSlideChange]);

  const [initialSlide] = useState(() => activeSlide ?? 0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: initialSlide,
    mode: 'snap',
    rubberband: true,
    defaultAnimation: {
      duration: 350,
      easing: DEFAULT_EASING,
    },
    slideChanged(slider) {
      const active = slider.track.details.rel;
      setCurrentSlide(active);
      onSlideChangeRef.current?.(active);
    },
  });

  const prevUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    const currentUrls = items.map((it) => it.url);
    const urlsChanged =
      currentUrls.length !== prevUrlsRef.current.length ||
      currentUrls.some((url, i) => url !== prevUrlsRef.current[i]);

    if (urlsChanged) {
      prevUrlsRef.current = currentUrls;
      instanceRef.current?.update(undefined, activeSlide ?? 0);
    }
  }, [items, activeSlide, instanceRef]);

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
            objectFit={objectFit}
          />
        ))}
      </div>

      <BulletDots
        count={items.length}
        currentSlide={currentSlide}
        onDotClick={(idx) => instanceRef.current?.moveToIdx(idx)}
      />
    </div>
  );
}
