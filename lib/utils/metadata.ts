import type { Metadata } from 'next';

export interface ConstructMetadataParams {
  title?: string;
  description?: string;
  image?: string | null;
  shopName?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'اینشاپ | انتخابهای باکیفیت برای خرید آنلاین';
const SITE_NAME = 'اینشاپ';
const DEFAULT_DESCRIPTION =
  'اینشاپ کالاهای باکیفیت فروشگاههای مستقل را یکجا پیش روی شما میگذارد تا راحتتر کشف کنید، دقیقتر بررسی کنید و مطمئنتر بخرید.';

/**
 * Formats page title for SEO & Social metadata, always appending "| اینشاپ".
 * Examples:
 * - formatTitle('قهوه اسپرسو', 'فروشگاه راین') => 'قهوه اسپرسو - فروشگاه راین | اینشاپ'
 * - formatTitle('قهوه اسپرسو')                 => 'قهوه اسپرسو | اینشاپ'
 * - formatTitle(undefined, 'فروشگاه راین')   => 'فروشگاه راین | اینشاپ'
 * - formatTitle()                              => 'اینشاپ | انتخابهای باکیفیت برای خرید آنلاین'
 */
const formatTitle = (title?: string, shopName?: string | null) => {
  const heading = [title, shopName].filter(Boolean).join(' - ');
  return heading ? `${heading} | ${SITE_NAME}` : DEFAULT_TITLE;
};

/**
 * Formats page description for SEO & Social metadata.
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
