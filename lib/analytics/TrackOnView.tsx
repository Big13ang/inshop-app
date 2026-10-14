'use client';

import { useInView } from 'react-intersection-observer';

/**
 * Returns a ref that calls `onView` once, the first time the element is actually visible.
 * Remount (or change the `key`) to track again.
 */
export function useTrackOnView<T extends Element = HTMLElement>(onView: () => void, threshold = 0.5) {
  const handleChange = (inView: boolean) => {
    if (inView) onView();
  };

  const { ref } = useInView({ triggerOnce: true, threshold, onChange: handleChange });

  return ref as (node?: T | null) => void;
}

interface TrackOnViewProps {
  onView: () => void;
}

/** Invisible marker that fires `onView` once when it scrolls into the viewport. */
export function TrackOnView({ onView }: TrackOnViewProps) {
  const ref = useTrackOnView<HTMLDivElement>(onView, 0);

  return <div ref={ref} aria-hidden="true" className="h-px w-full" data-testid="track-on-view" />;
}
