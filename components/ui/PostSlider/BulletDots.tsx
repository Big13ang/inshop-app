import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { bulletDot } from './utils';

function BulletDot({
  idx,
  currentSlide,
  onClick,
  onHover,
}: {
  idx: number;
  currentSlide: number;
  onClick: (idx: number) => void;
  onHover?: (idx: number) => void;
}) {
  const dist = Math.abs(currentSlide - idx);
  const distVariant = dist === 0 ? 0 : dist === 1 ? 1 : dist === 2 ? 2 : ('far' as const);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      shape="circle"
      onClick={(e) => {
        e.stopPropagation();
        onClick(idx);
      }}
      onMouseEnter={() => onHover?.(idx)}
      onTouchStart={() => onHover?.(idx)}
      className={cn(bulletDot({ current: currentSlide === idx, distance: distVariant }))}
      aria-label={`Go to slide ${idx + 1}`}
      id={`slider-dot-${idx}`}
    />
  );
}

export function BulletDots({
  count,
  currentSlide,
  onDotClick,
  onDotHover,
}: {
  count: number;
  currentSlide: number;
  onDotClick: (idx: number) => void;
  onDotHover?: (idx: number) => void;
}) {
  if (count <= 1) return null;

  return (
    <div
      dir="ltr"
      className="absolute bottom-4 left-0 right-0 z-10 flex justify-center items-center gap-1.5 pointer-events-none"
    >
      {Array.from({ length: count }, (_, idx) => (
        <BulletDot
          key={`dot-${idx}`}
          idx={idx}
          currentSlide={currentSlide}
          onClick={onDotClick}
          onHover={onDotHover}
        />
      ))}
    </div>
  );
}
