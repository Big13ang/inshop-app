import PostSlider from '@/components/ui/PostSlider';
import { usePostContext } from './PostContext';

interface PostMediaProps {
  children?: React.ReactNode;
}

export function PostMedia({ children }: PostMediaProps) {
  const { state } = usePostContext();

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-container">
      <PostSlider images={state.post.mediaUrls} />
      {children}
    </div>
  );
}
