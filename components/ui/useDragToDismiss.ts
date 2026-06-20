'use client';

import * as React from 'react';

export interface UseDragToDismissOptions {
  /** Set to false to disable drag handling entirely. */
  enabled?: boolean;
  /** Downward distance (px) that always triggers a dismiss. */
  threshold: number;
  /** Minimum velocity (px/ms) that triggers a dismiss once `velocityDistance` is exceeded. */
  velocityThreshold?: number;
  /** Distance (px) above which the velocity check kicks in. Defaults to 20. */
  velocityDistance?: number;
  /** Called on every move with the clamped downward offset (>= 0). */
  onDragMove?: (offset: number) => void;
  /** Called when the drag ends past the dismiss threshold. */
  onDismiss: () => void;
  /** Called when the drag ends below the dismiss threshold. */
  onCancel: () => void;
}

export interface DragToDismissHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

/** Tracks a vertical drag gesture and decides whether it crosses a dismiss threshold. */
export function useDragToDismiss(options: UseDragToDismissOptions): DragToDismissHandlers {
  const {
    enabled = true,
    threshold,
    velocityThreshold,
    velocityDistance = 20,
    onDragMove,
    onDismiss,
    onCancel,
  } = options;

  const isDraggingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const currentYRef = React.useRef(0);
  const startTimeRef = React.useRef(0);

  const start = (clientY: number) => {
    if (!enabled) return;
    isDraggingRef.current = true;
    startYRef.current = clientY;
    currentYRef.current = 0;
    startTimeRef.current = Date.now();
  };

  const move = (clientY: number) => {
    if (!isDraggingRef.current) return;
    const offset = Math.max(0, clientY - startYRef.current);
    currentYRef.current = offset;
    onDragMove?.(offset);
  };

  const end = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const deltaY = currentYRef.current;
    const velocity = deltaY / (Date.now() - startTimeRef.current || 1);

    const shouldDismiss =
      deltaY > threshold ||
      (velocityThreshold !== undefined && deltaY > velocityDistance && velocity > velocityThreshold);

    if (shouldDismiss) onDismiss();
    else onCancel();
  };

  return {
    onTouchStart: (e) => start(e.touches[0].clientY),
    onTouchMove: (e) => move(e.touches[0].clientY),
    onTouchEnd: end,
    onMouseDown: (e) => start(e.clientY),
    onMouseMove: (e) => { if (e.buttons === 1) move(e.clientY); },
    onMouseUp: end,
    onMouseLeave: end,
  };
}
