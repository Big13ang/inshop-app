import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      z: [
        'z-base',
        'z-badge',
        'z-floating',
        'z-elevated',
        'z-header',
        'z-nav',
        'z-fullscreen-backdrop',
        'z-fullscreen',
        'z-modal-backdrop',
        'z-modal',
        'z-popover',
        'z-toast',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
