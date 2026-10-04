import { useEffect, useRef } from 'react';

/**
 * Automatically scrolls the currently active date item (selected day, month, or year)
 * into the vertical center of the picker scroll container.
 *
 * Behavior:
 * - When the view mounts or when the search query is empty, it smoothly scrolls
 *   the selected item into view so the user doesn't have to hunt for their current date.
 * - When the user is actively filtering results with a search query (`shouldScroll === false`),
 *   scrolling is skipped to prevent disorienting jumps while typing.
 *
 * @param shouldScroll - Boolean flag indicating if auto-scroll should run (defaults to true)
 * @returns ref to attach to the currently selected option button
 */
export function useScrollSelectedIntoView(shouldScroll = true) {
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shouldScroll) {
      selectedItemRef.current?.scrollIntoView?.({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [shouldScroll]);

  return selectedItemRef;
}
