import { cn } from '@/lib/utils';
import { usePostContext } from './PostContext';

interface PostAuthorNameProps {
  fallback?: string;
  className?: string;
}

export function PostAuthorName({ fallback = 'فروشگاه', className }: PostAuthorNameProps) {
  const { state } = usePostContext();

  return (
    <span className={cn('text-sm font-bold text-primary', className)}>
      {state.post.sellerName || fallback}
    </span>
  );
}
