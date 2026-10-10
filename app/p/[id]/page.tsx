import type { Metadata } from 'next';
import { PublicPostPageContent } from '@/features/posts/public/PublicPostPageContent';
import { fetchPublicPostServer } from '@/features/posts/services/publicPostServerService';
import { Result } from '@/lib/utils/result';
import { getMediaUrl } from '@/lib/utils/media';
import { constructMetadata } from '@/lib/utils/metadata';
import { extractPostTitle, formatPostMetaDescription } from '@/features/posts/utils/formatDescription';
import { isCrawlerRequest } from '@/lib/utils/crawler';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isCrawler = await isCrawlerRequest();

  // Instant response for normal human users without blocking navigation (CSR)
  if (!isCrawler) {
    return constructMetadata({
      title: 'پست',
      description: 'مشاهده مشخصات و خرید آنلاین محصولات در اینشاپ',
      type: 'article',
    });
  }

  const { id } = await params;
  const postResult = await Result.try(() => fetchPublicPostServer(id));
  const post = postResult.ok ? postResult.value : null;

  if (!post) {
    return constructMetadata({
      title: 'پست',
      description: 'مشاهده مشخصات و خرید آنلاین محصولات در اینشاپ',
      type: 'article',
    });
  }

  const owner = post.owner || post.shop;
  const rawShopName = owner?.shopName?.trim() || undefined;
  const shopName = rawShopName
    ? rawShopName.startsWith('فروشگاه')
      ? rawShopName
      : `فروشگاه ${rawShopName}`
    : undefined;
  const coverMedia = post.media?.[0];
  const image = coverMedia ? getMediaUrl(coverMedia) : null;
  const postTitle = extractPostTitle(post.description);
  const metaDescription = formatPostMetaDescription(post.description, shopName);

  return constructMetadata({
    title: postTitle,
    description: metaDescription,
    image,
    shopName,
    type: 'article',
  });
}

export default async function PublicPostPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicPostPageContent postId={id} />;
}

