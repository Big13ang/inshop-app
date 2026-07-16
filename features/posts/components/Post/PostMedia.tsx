import PostSlider from '@/components/ui/PostSlider';
import { usePostContext } from './PostContext';
import { getMediaUrl } from '../../utils/media';

interface PostMediaProps {
  children?: React.ReactNode;
}

export function PostMedia({ children }: PostMediaProps) {
  const { state } = usePostContext();
  const mediaUrls = state.post.media?.map(getMediaUrl) ?? [];

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-container">
      <PostSlider images={mediaUrls} />
      {children}
    </div>
  );
}
