import { Suspense } from 'react';
import { InterceptedPostDialog } from '@/features/posts/public/InterceptedPostDialog';
import { PublicPostPageContent } from '@/features/posts/public/PublicPostPageContent';
import PublicPostSkeleton from '@/features/posts/public/PublicPostSkeleton';

interface InterceptedPostPageProps {
  params: Promise<{ id: string }>;
}

async function InterceptedPostContent({ params }: InterceptedPostPageProps) {
  const { id } = await params;

  return <PublicPostPageContent postId={id} />;
}

export default function InterceptedPostPage({ params }: InterceptedPostPageProps) {
  return (
    <InterceptedPostDialog>
      <Suspense fallback={<PublicPostSkeleton />}>
        <InterceptedPostContent params={params} />
      </Suspense>
    </InterceptedPostDialog>
  );
}
