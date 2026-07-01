import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { usePostContext } from './PostContext';

export function PostVerifiedBadge() {
  const { state } = usePostContext();
  if (!state.post.isVerified) return null;
  return <VerifiedBadge className="h-3.5 w-3.5" />;
}
