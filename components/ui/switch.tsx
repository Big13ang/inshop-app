'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends SwitchPrimitive.Root.Props {
  ref?: React.Ref<HTMLButtonElement>;
}

function Switch({ className, ref, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border border-transparent bg-container-active p-0.5 outline-none transition-colors duration-fast',
        'focus-visible:ring-3 focus-visible:ring-primary/20',
        'data-[checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'block size-5 rounded-pill bg-surface-l3 shadow-raised transition-transform duration-normal ease-out-smooth',
          // RTL-safe: the track is laid out LTR internally, so the thumb travels on X.
          'translate-x-0 data-[checked]:-translate-x-5',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
