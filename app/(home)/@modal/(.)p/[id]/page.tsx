import { InterceptedPostDialog } from '@/features/posts/public/InterceptedPostDialog';
import { PublicPostPageContent } from '@/features/posts/public/PublicPostPageContent';

interface InterceptedPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterceptedPostPage({ params }: InterceptedPostPageProps) {
  const { id } = await params;

  return (
    <InterceptedPostDialog>
      <PublicPostPageContent postId={id} />
    </InterceptedPostDialog>
  );
}
