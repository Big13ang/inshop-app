/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { cn } from '@/lib/utils';

const DEFAULT_EASING = (t: number) => 1 - Math.pow(1 - t, 4);
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface PostSliderProps {
  images?: string[];
  media?: { url: string; type?: 'image' | 'video'; alt?: string }[];
  activeSlide?: number;
  onSlideChange?: (index: number) => void;
  objectFit?: 'cover' | 'contain';
}

function SlideItem({
  item,
  idx,
  objectFit,
}: {
  item: { url: string; type: 'image' | 'video'; alt?: string };
  idx: number;
  objectFit: 'cover' | 'contain';
}) {
  const isContain = objectFit === 'contain';

  return (
    <div
      className={cn(
        'keen-slider__slide relative flex items-center justify-center',
        isContain ? 'bg-black' : 'bg-neutral-100 dark:bg-zinc-900'
      )}
      id={`slide-${idx}`}
    >
      {item.type === 'video' ? (
        <video
          src={item.url}
          autoPlay
          controls
          playsInline
          loop
          muted
          className={cn(
            'h-full w-full select-none',
            isContain ? 'object-contain' : 'object-cover'
          )}
          id={`slide-video-${idx}`}
        />
      ) : (
        <img
          src={item.url}
          alt={item.alt || `Product showcase ${idx + 1}`}
          className={cn(
            'h-full w-full select-none',
            isContain ? 'object-contain' : 'object-cover'
          )}
          id={`slide-img-${idx}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}

function BulletDot({
  idx,
  currentSlide,
  onClick,
}: {
  idx: number;
  currentSlide: number;
  onClick: (idx: number) => void;
}) {
  const distance = Math.abs(currentSlide - idx);
  const isCurrent = currentSlide === idx;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(idx);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'h-1.5 w-1.5 rounded-full bg-white transition-all duration-200 pointer-events-auto cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        isCurrent ? 'w-2.5 opacity-100' : 'bg-white/60',
        distance === 1 && 'scale-90 opacity-70',
        distance === 2 && 'scale-75 opacity-40',
        distance > 2 && 'scale-50 opacity-20'
      )}
      aria-label={`Go to slide ${idx + 1}`}
      id={`slider-dot-${idx}`}
    />
  );
}

export default function PostSlider({
  images = [],
  media,
  activeSlide = 0,
  onSlideChange,
  objectFit = 'cover',
}: PostSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(activeSlide);
  const isHydrated = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const items = (media || images).map((entry) => {
    if (typeof entry === 'string') return { url: entry, type: 'image' as const };
    return { url: entry.url, type: entry.type || ('image' as const) };
  });

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: activeSlide,
    mode: 'snap',
    rubberband: true,
    defaultAnimation: {
      duration: 350,
      easing: DEFAULT_EASING,
    },
    animationEnded(slider) {
      const active = slider.track.details.rel;
      setCurrentSlide(active);
      onSlideChange?.(active);
    },
  });

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.update();
    }
  }, [items.length, instanceRef]);

  if (items.length === 0) return null;

  if (!isHydrated) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-neutral-200 animate-pulse" id="post-slider-skeleton" />
    );
  }

  return (
    <div
      className="relative w-full h-full group overflow-hidden"
      id="post-slider-container"
      tabIndex={0}
      role="region"
      aria-label="گالری تصاویر و ویدیوهای محصول"
    >
      <div ref={sliderRef} className="keen-slider h-full w-full">
        {items.map((item, idx) => (
          <SlideItem
            key={`${item.url}-${idx}`}
            item={item}
            idx={idx}
            objectFit={objectFit}
          />
        ))}
      </div>

      {items.length > 1 ? (
        <div dir="ltr" className="absolute bottom-4 left-0 right-0 z-10 flex justify-center items-center gap-1.5 pointer-events-none">
          {items.map((_, idx) => (
            <BulletDot
              key={`dot-${idx}`}
              idx={idx}
              currentSlide={currentSlide}
              onClick={(index) => instanceRef.current?.moveToIdx(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
