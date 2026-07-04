'use client';

import { useEffect, useRef, useSyncExternalStore, useTransition } from 'react';
import type { BaseUIEvent } from '@base-ui/react/types';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';

const MOTION = {
  hoverScale: 1.08,
  pressScale: 0.92,
  normalScale: 1,
  hoverDuration: 0.22,
  pressDuration: 0.1,
};

const emptySubscribe = () => () => {};

export interface AnimatedIconButtonProps extends Omit<ButtonProps, 'variant' | 'size' | 'shape'> {
  isActive?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export default function AnimatedIconButton({
  children,
  onClick,
  onPointerEnter,
  onPointerLeave,
  isActive,
  className,
  disabled = false,
  ref,
  ...props
}: AnimatedIconButtonProps) {
  const [, startTransition] = useTransition();
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isActive || !iconRef.current || disabled) return;

    gsap.killTweensOf(iconRef.current);
    gsap.fromTo(
      iconRef.current,
      { scale: 0.82 },
      { scale: 1, duration: 0.42, ease: 'back.out(2)', force3D: true }
    );
  }, [isActive, disabled]);

  useEffect(() => {
    const button = buttonRef.current;
    const icon = iconRef.current;
    return () => {
      if (button) gsap.killTweensOf(button);
      if (icon) gsap.killTweensOf(icon);
    };
  }, []);

  function animateButton(scale: number, duration = MOTION.hoverDuration, ease = 'power3.out') {
    if (!buttonRef.current || disabled) return;

    gsap.killTweensOf(buttonRef.current);
    gsap.to(buttonRef.current, {
      scale,
      duration,
      ease,
      force3D: true,
      overwrite: 'auto',
    });
  }

  function handlePointerEnter(event: BaseUIEvent<React.PointerEvent<HTMLButtonElement>>) {
    onPointerEnter?.(event);
    if (event.pointerType === 'mouse') animateButton(MOTION.hoverScale);
  }

  function handlePointerLeave(event: BaseUIEvent<React.PointerEvent<HTMLButtonElement>>) {
    onPointerLeave?.(event);
    if (event.pointerType === 'mouse') animateButton(MOTION.normalScale);
  }

  function handlePointerDown() {
    animateButton(MOTION.pressScale, MOTION.pressDuration, 'power2.out');
  }

  function handlePointerUp(event: BaseUIEvent<React.PointerEvent<HTMLButtonElement>>) {
    const settleScale = event.pointerType === 'mouse' ? MOTION.hoverScale : MOTION.normalScale;
    animateButton(settleScale, MOTION.pressDuration, 'power2.out');
  }

  function handleClick(event: BaseUIEvent<React.MouseEvent<HTMLButtonElement>>) {
    if (disabled) return;

    startTransition(() => {
      onClick?.(event);
    });
  }

  if (!isHydrated) {
    return (
      <span
        className="h-11 w-11 shrink-0 rounded-full opacity-40"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 44px' }}
      />
    );
  }

  return (
    <Button
      ref={(node) => {
        buttonRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      type="button"
      variant="ghost"
      shape="circle"
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => animateButton(MOTION.normalScale)}
      disabled={disabled}
      className={cn(
        'relative h-11 w-11 cursor-pointer select-none border-none bg-transparent p-0 text-primary outline-none transition-opacity duration-200 transform-gpu [will-change:transform] hover:bg-transparent',
        'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20',
        className
      )}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 44px' }}
      {...props}
    >
      <span ref={iconRef} className="flex h-full w-full items-center justify-center transform-gpu [will-change:transform]">
        {children}
      </span>
    </Button>
  );
}
