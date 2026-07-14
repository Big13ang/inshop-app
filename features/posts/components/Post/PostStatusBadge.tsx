import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PostStatusBadgeProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function PostStatusBadge({ icon, children, onClick, className }: PostStatusBadgeProps) {
  const baseClassName = cn(
    'absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/85 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md',
    className
  );

  if (onClick) {
    return (
      <Button
        variant="ghost"
        onClick={onClick}
        className={cn(baseClassName, 'transition-all active:scale-95')}
      >
        {icon}
        <span>{children}</span>
      </Button>
    );
  }

  return (
    <div className={baseClassName}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
