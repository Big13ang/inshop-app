'use client';

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
  const sentinelRef = (node: HTMLDivElement | null) => {
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    observer.observe(node);
  };

  return sentinelRef;
}

export default useInfiniteScrollSentinel;
