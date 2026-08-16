import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

import type { PostSliderProps } from './types';
import {
  DEFAULT_EASING,
  CONTAINER_CLASSES,
  emptySubscribe,
  calculatePostMediaAspectRatio,
} from './utils';
import { SlideItem } from './SlideItem';
import { BulletDots } from './BulletDots';

export type { PostSliderProps, PostSliderItem } from './types';
export { SlideItem } from './SlideItem';
export { BulletDots } from './BulletDots';

export default function PostSlider({
  items,
  activeSlide,
  onSlideChange,
  objectFit = 'cover',
}: PostSliderProps) {


  const [currentSlide, setCurrentSlide] = useState(() => activeSlide ?? 0);
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleImageLoad = (url: string, ratio: number) => {
    setAspectRatios((prev) => (prev[url] === ratio ? prev : { ...prev, [url]: ratio }));
    requestAnimationFrame(() => instanceRef.current?.update());
  };

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
    created(slider) {
      slider.update();
    },
    slideChanged(slider) {
      const active = slider.track.details.rel;
      setCurrentSlide(active);
      onSlideChangeRef.current?.(active);
    },
  });

  // Keep slider layout updated when container resizes
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      instanceRef.current?.update();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [instanceRef]);

  // Update slider track when item URLs change
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

  // Sync active slide prop with slider track
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

  const activeUrl = items[currentSlide]?.url;
  const firstUrl = items[0]?.url;
  const activeRatio = (activeUrl ? aspectRatios[activeUrl] : undefined) ?? (firstUrl ? aspectRatios[firstUrl] : undefined);
  const containerAspectRatio = calculatePostMediaAspectRatio(items.length, activeRatio);

  if (items.length === 0) return null;

  if (!isHydrated) {
    return (
      <div
        className={CONTAINER_CLASSES}
        id="post-slider-container-skeleton"
        style={{ aspectRatio: containerAspectRatio }}
      >
        <div className="absolute inset-0 bg-neutral-200 animate-shimmer" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={CONTAINER_CLASSES}
      id="post-slider-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="گالری تصاویر"
      style={{
        aspectRatio: containerAspectRatio,
        transition: 'aspect-ratio 0.3s ease-in-out',
      }}
    >
      <div ref={sliderRef} className="keen-slider h-full w-full">
        {items.map((item, idx) => (
          <SlideItem
            key={item?.url || idx}
            item={item}
            idx={idx}
            objectFit={objectFit}
            onImageLoad={handleImageLoad}
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
