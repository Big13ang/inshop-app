import { useState } from 'react';

export function usePreloadedSlides(totalItems: number) {
  const [loadedIndexes, setLoadedIndexes] = useState<Set<number>>(
    () => new Set([0, 1])
  );

  const preloadAround = (active: number) => {
    setLoadedIndexes((prev) => {
      const next = new Set(prev);
      next.add(active);
      if (active > 0) next.add(active - 1);
      if (active < totalItems - 1) next.add(active + 1);
      return next;
    });
  };

  const preloadSingle = (idx: number) => {
    setLoadedIndexes((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  return { loadedIndexes, preloadAround, preloadSingle };
}

export function useMediaLoaded() {
  const [loadedIndexes, setLoadedIndexes] = useState<Set<number>>(() => new Set());

  const markLoaded = (idx: number) => {
    setLoadedIndexes((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  return { loadedIndexes, markLoaded };
}
