import { cva } from 'class-variance-authority';

export const emptySubscribe = () => () => { };
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
  'w-full h-full select-none',
  {
    variants: {
      objectFit: {
        contain: 'object-contain',
        cover: 'object-cover',
      },
      loaded: {
        true: '',
        false: '',
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

/**
 * Rules for post image/slider aspect ratios (width/height):
 * 1. Single-image posts:
 *    - The width fits the container width (100%).
 *    - The height is flexible to match the image's height.
 *    - The maximum height is capped at a 9:16 aspect ratio (the vertical 16:9 format).
 *    - Mathematically, H <= W * (16/9). Since aspect ratio R = W/H, this means
 *      R >= 9/16 (0.5625). Therefore, the container's aspect ratio must be at least 9/16.
 *      So, containerAspectRatio = Math.max(9/16, imageAspectRatio).
 * 2. Multi-image sliders:
 *    - To prevent height shifts and look consistent, all slides must have the same size.
 *    - They are fixed to a 1:1 aspect ratio (square).
 */
export const calculatePostMediaAspectRatio = (
  itemCount: number,
  imageAspectRatio?: number
): number => {
  // If there are multiple images, force a clean 1:1 square ratio for consistency
  if (itemCount > 1) {
    return 1.0;
  }

  // If we have a single image and know its natural aspect ratio, cap the max height to 9:16
  if (imageAspectRatio) {
    return Math.max(9 / 16, imageAspectRatio);
  }

  // Default fallback before the image finishes loading
  return 1.0;
};

