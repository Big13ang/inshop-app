import { cn } from '@/lib/utils';

interface PostRootProps {
  children: React.ReactNode;
  className?: string;
}

export function PostRoot({ children, className }: PostRootProps) {
  return (
    <article className={cn('w-full border-b border-primary/5 bg-surface pb-3', className)} dir="rtl">
      {children}
    </article>
  );
}
