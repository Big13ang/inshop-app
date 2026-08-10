import type { Metadata } from 'next';

export interface ConstructMetadataParams {
  title?: string;
  description?: string;
  image?: string | null;
  shopName?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'این‌شاپ';
const DEFAULT_DESCRIPTION = 'مشاهده جزییات محصول و کسب‌وکار در این‌شاپ';

/**
 * Formats page title for SEO & Social metadata, always appending "| این‌شاپ".
 * Examples:
 * - formatTitle('قهوه اسپرسو', 'فروشگاه راین') => 'قهوه اسپرسو - فروشگاه راین | این‌شاپ'
 * - formatTitle('قهوه اسپرسو')                 => 'قهوه اسپرسو | این‌شاپ'
 * - formatTitle(undefined, 'فروشگاه راین')   => 'فروشگاه راین | این‌شاپ'
 * - formatTitle()                              => 'این‌شاپ'
 */
const formatTitle = (title?: string, shopName?: string | null) => {
  const heading = [title, shopName].filter(Boolean).join(' - ');
  return heading ? `${heading} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
};

/**
 * Formats page description for SEO & Social metadata, ensuring "در این‌شاپ" is at the end.
 * Examples:
 * - formatDescription('دانه‌های تازه برشته شده', 'فروشگاه راین') => 'دانه‌های تازه برشته شده - فروشگاه راین در این‌شاپ'
 * - formatDescription('دانه‌های تازه برشته شده')                   => 'دانه‌های تازه برشته شده - این‌شاپ'
 */
const formatDescription = (desc?: string, shopName?: string | null) => {
  const trimmed = desc?.trim();
  if (trimmed) return trimmed;
  return shopName ? `${DEFAULT_DESCRIPTION} - ${shopName}` : DEFAULT_DESCRIPTION;
};

export function constructMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  shopName,
  type = 'website',
  noIndex = false,
}: ConstructMetadataParams = {}): Metadata {
  const metaTitle = formatTitle(title, shopName);
  const metaDesc = formatDescription(description, shopName);
  const images = image ? [{ url: image }] : [];

  return {
    title: metaTitle,
    description: metaDesc,
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      images,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDesc,
      images: image ? [image] : [],
    },
    ...(noIndex && {
      robots: { index: false, follow: false },
    }),
  };
}

export function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength)}...`;
}
