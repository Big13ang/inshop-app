'use client';

import { useEffect, useRef } from 'react';

export interface UseInfiniteScrollSentinelProps {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
}

export function useInfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseInfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLockedRef = useRef(false);

  useEffect(() => {
    if (!hasNextPage) return;

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage && !isLockedRef.current) {
        isLockedRef.current = true;
        fetchNextPage();
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '250px',
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!isFetchingNextPage) {
      isLockedRef.current = false;
    }
  }, [isFetchingNextPage]);

  return sentinelRef;
}
