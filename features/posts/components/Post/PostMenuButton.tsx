import { MoreHorizontal } from 'lucide-react';
import { usePostContext } from './PostContext';

export function PostMenuButton({ label = 'بیشتر' }: { label?: string }) {
  const { actions } = usePostContext();

  return (
    <button
      onClick={actions.openMenu}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-zinc-100 active:scale-90"
      aria-label={label}
    >
      <MoreHorizontal className="h-7 w-7" strokeWidth={2} />
    </button>
  );
}
