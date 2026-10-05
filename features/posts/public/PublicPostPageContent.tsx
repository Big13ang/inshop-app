import { Result } from '@/lib/utils/result';
import { fetchPublicPostServer } from '@/features/posts/services/publicPostServerService';
import { PublicPostView } from './PublicPostView';

interface PublicPostPageContentProps {
  postId: string;
}

export async function PublicPostPageContent({ postId }: PublicPostPageContentProps) {
  const postResult = await Result.try(() => fetchPublicPostServer(postId));
  const post = postResult.ok ? postResult.value : null;

  return <PublicPostView postId={postId} initialPost={post} />;
}
