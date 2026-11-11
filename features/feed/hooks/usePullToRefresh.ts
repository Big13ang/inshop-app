'use client';

import { useEffect, useRef, useReducer } from 'react';
import { useDrag, type FullGestureState } from '@use-gesture/react';
import { Result } from '@/lib/utils';

export interface UsePullToRefreshProps {
  onRefresh: () => Promise<unknown> | undefined;
}

export type PullStatus = 'idle' | 'pulling' | 'refreshing';

export interface PullState {
  status: PullStatus;
  pullDistance: number;
}

export type PullAction =
  | { type: 'PULL'; distance: number }
  | { type: 'RESET' }
  | { type: 'START_REFRESH' }
  | { type: 'END_REFRESH' };

const INITIAL_STATE: PullState = {
  status: 'idle',
  pullDistance: 0,
};

// `pointer.touch` drives the drag with touch events. With pointer events the browser
// fires `pointercancel` as soon as it starts its own scroll/overscroll, which killed
// the pull on phones (and triggered use-gesture's `touch-action: auto` warning).
const PULL_GESTURE_CONFIG = {
  axis: 'y' as const,
  filterTaps: true,
  pointer: { touch: true },
};

const MIN_REFRESH_THRESHOLD_PX = 45;

export function pullReducer(state: PullState, action: PullAction): PullState {
  switch (action.type) {
    case 'PULL':
      if (state.status === 'refreshing') return state;
      return { status: 'pulling', pullDistance: action.distance };

    case 'RESET':
      return { status: 'idle', pullDistance: 0 };

    case 'START_REFRESH':
      return { status: 'refreshing', pullDistance: 0 };

    case 'END_REFRESH':
      return { status: 'idle', pullDistance: 0 };

    default:
      return state;
  }
}

function calculateDampedDistance(diffY: number): number {
  const maxPull = 85;
  const dampFactor = 0.45;
  return Math.min(maxPull, (diffY * dampFactor) ** 0.92);
}

/**
 * At the top of the list, a downward touch would start the browser's own overscroll
 * (or Chrome's pull-to-reload) instead of our pull. Blocking that move keeps the
 * gesture ours; scrolling anywhere below the top is left untouched.
 */
export function keepPullDownFromScrollingNatively(element: HTMLElement): () => void {
  let touchStartY = 0;

  function handleTouchStart(event: TouchEvent) {
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event: TouchEvent) {
    const isAtTop = element.scrollTop <= 0;
    const isPullingDown = event.touches[0].clientY > touchStartY;
    if (isAtTop && isPullingDown && event.cancelable) event.preventDefault();
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
  };
}

export function usePullToRefresh({ onRefresh }: UsePullToRefreshProps) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(pullReducer, INITIAL_STATE);

  // React's onTouchMove is passive, so preventDefault needs a native listener.
  useEffect(() => {
    const element = mainRef.current;
    if (!element) return;
    return keepPullDownFromScrollingNatively(element);
  }, []);

  const isRefreshing = state.status === 'refreshing';
  const isPullDownActive = state.status === 'pulling';

  const handleRefresh = async () => {
    dispatch({ type: 'START_REFRESH' });

    await Result.try(() => onRefresh());

    dispatch({ type: 'END_REFRESH' });
  };

  const handlePullToRefreshDrag = (gesture: FullGestureState<'drag'>) => {
    const deltaY = gesture.movement[1];
    const isDragEnd = gesture.last;
    const containerScrollTop = mainRef.current?.scrollTop ?? 0;

    if (isRefreshing || containerScrollTop > 0) return;

    if (isDragEnd) {
      const isThresholdReached = state.pullDistance >= MIN_REFRESH_THRESHOLD_PX;

      dispatch({ type: 'RESET' });

      if (isThresholdReached) {
        handleRefresh();
      }

      return;
    }

    if (deltaY > 0) {
      const distance = calculateDampedDistance(deltaY);

      dispatch({ type: 'PULL', distance });
    }
  };

  const bind = useDrag(handlePullToRefreshDrag, PULL_GESTURE_CONFIG);

  return {
    mainRef,
    pullDistance: state.pullDistance,
    isPullDownActive,
    isRefreshing,
    handleRefresh,
    bind,
  };
}

