import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePostContext } from './PostContext';

export function PostMenuButton({ label = 'بیشتر' }: { label?: string }) {
  const { actions } = usePostContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      shape="circle"
      onClick={actions.openMenu}
      className="text-primary hover:bg-zinc-100 active:scale-90"
      aria-label={label}
    >
      <MoreHorizontal className="h-7 w-7" strokeWidth={2} />
    </Button>
  );
}
