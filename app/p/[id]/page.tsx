import type { Metadata } from 'next';
import { fetchPublicPostServer } from '@/features/posts/services/publicPostServerService';
import PublicPostView from '@/features/posts/public/PublicPostView';
import { getMediaUrl } from '@/features/posts/utils/media';
import { constructMetadata, truncateText } from '@/lib/utils/metadata';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPublicPostServer(id);

  if (!post) {
    return constructMetadata({
      title: 'پست یافت نشد',
      description: 'این پست وجود ندارد یا حذف شده است.',
      noIndex: true,
    });
  }

  const postAny = post as unknown as Record<string, unknown>;
  const shopName = (postAny.sellerName as string) || (postAny.shopName as string) || undefined;
  const title = post.description ? truncateText(post.description, 60) : undefined;
  const coverMedia = post.media?.[0];
  const image = coverMedia ? getMediaUrl(coverMedia) : null;

  return constructMetadata({
    title,
    description: post.description,
    image,
    shopName,
    type: 'article',
  });
}

export default async function PublicPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await fetchPublicPostServer(id);

  return <PublicPostView postId={id} initialPost={post} />;
}
