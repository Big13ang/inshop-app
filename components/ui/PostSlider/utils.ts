import { cva } from 'class-variance-authority';
import type { MediaItem } from './types';

export const emptySubscribe = () => () => {};
export const EMPTY_ARRAY: string[] = [];
export const DEFAULT_EASING = (t: number) => 1 - Math.pow(1 - t, 4);
export const CONTAINER_CLASSES =
  'relative w-full h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-50 overflow-hidden';

export const slideContainer = cva(
  'keen-slider__slide relative flex items-center justify-center',
  {
    variants: {
      objectFit: {
        contain: 'bg-black',
        cover: 'bg-neutral-100 dark:bg-zinc-900',
      },
    },
  }
);

export const slideMedia = cva(
  'w-full h-full select-none transition-opacity duration-300',
  {
    variants: {
      objectFit: {
        contain: 'object-contain',
        cover: 'object-cover',
      },
      loaded: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
  }
);

export const bulletDot = cva(
  'w-1.5 h-1.5 rounded-full transition-all duration-200 pointer-events-auto cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
  {
    variants: {
      current: {
        true: 'w-2.5 bg-white opacity-100',
        false: 'bg-white/60',
      },
      distance: {
        0: 'scale-100',
        1: 'scale-90 opacity-70',
        2: 'scale-75 opacity-40',
        far: 'scale-50 opacity-20',
      },
    },
  }
);

export function normalizeMediaItems(
  rawList: (string | Partial<MediaItem>)[]
): MediaItem[] {
  const result: MediaItem[] = [];
  for (const entry of rawList) {
    if (typeof entry === 'string') {
      result.push({ url: entry, type: 'image' });
    } else if (entry?.url) {
      result.push({ url: entry.url, type: entry.type ?? 'image' });
    }
  }
  return result;
}
