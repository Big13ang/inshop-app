import PostSlider from '@/components/ui/PostSlider';
import { usePostContext } from './PostContext';
import { getMediaUrl, getThumbnailUrl } from '@/lib/utils/media';

interface PostMediaProps {
  children?: React.ReactNode;
}

export function PostMedia({ children }: PostMediaProps) {
  const { state } = usePostContext();
  const items = state.post.media?.map(item => ({
    url: getMediaUrl(item),
    thumbnailUrl: getThumbnailUrl(item),
    alt: state.post.description || undefined,
  })) ?? [];

  return (
    <div className="relative w-full overflow-hidden bg-surface-container">
      <PostSlider items={items} />
      {children}
    </div>
  );
}
