import PostSlider from '@/components/ui/PostSlider';
import { usePostContext } from './PostContext';
import { getMediaUrl } from '../../utils/media';

interface PostMediaProps {
  children?: React.ReactNode;
}

export function PostMedia({ children }: PostMediaProps) {
  const { state } = usePostContext();
  const items = state.post.media?.map(item => ({
    url: getMediaUrl(item),
  })) ?? [];

  return (
    <div className="relative w-full overflow-hidden bg-surface-container">
      <PostSlider items={items} />
      {children}
    </div>
  );
}
