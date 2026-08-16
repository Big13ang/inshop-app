import type { Metadata } from 'next';
import { fetchPublicPostServer } from '@/features/posts/services/publicPostServerService';
import PublicPostView from '@/features/posts/public/PublicPostView';
import { getMediaUrl } from '@/lib/utils';
import { constructMetadata } from '@/lib/utils/metadata';

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

  const rawShopName = post.shop?.shopName || undefined;
  const shopName = rawShopName
    ? rawShopName.startsWith('فروشگاه')
      ? rawShopName
      : `فروشگاه ${rawShopName}`
    : undefined;
  const coverMedia = post.media?.[0];
  const image = coverMedia ? getMediaUrl(coverMedia) : null;

  return constructMetadata({
    title: undefined,
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
