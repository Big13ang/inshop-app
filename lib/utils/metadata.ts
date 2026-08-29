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

const cleanTitlePart = (str?: string | null): string | undefined => {
  if (!str) return undefined;
  let trimmed = str.trim();
  if (!trimmed) return undefined;
  // Strip trailing " | اینشاپ" or " | SITE_NAME" if present
  trimmed = trimmed.replace(new RegExp(`\\s*\\|\\s*${SITE_NAME}\\s*$`, 'i'), '').trim();
  return trimmed || undefined;
};

/**
 * Formats page title for SEO & Social metadata.
 * The root layout template (`%s | اینشاپ`) will automatically append the site name.
 * Examples:
 * - formatTitle('قهوه اسپرسو', 'فروشگاه راین') => 'قهوه اسپرسو - فروشگاه راین' (rendered as 'قهوه اسپرسو - فروشگاه راین | اینشاپ')
 * - formatTitle('قهوه اسپرسو')                 => 'قهوه اسپرسو' (rendered as 'قهوه اسپرسو | اینشاپ')
 * - formatTitle(undefined, 'فروشگاه راین')   => 'فروشگاه راین' (rendered as 'فروشگاه راین | اینشاپ')
 * - formatTitle()                              => undefined (rendered as default title from layout)
 */
export const formatTitle = (title?: string, shopName?: string | null): string | undefined => {
  const cleanTitle = cleanTitlePart(title);
  const cleanShop = cleanTitlePart(shopName);
  const heading = [cleanTitle, cleanShop].filter(Boolean).join(' - ');

  if (!heading || heading === SITE_NAME || heading === DEFAULT_TITLE) {
    return undefined;
  }

  return heading;
};

/**
 * Formats page description for SEO & Social metadata.
 */
export const formatDescription = (desc?: string, shopName?: string | null): string => {
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
    ...(metaTitle ? { title: metaTitle } : {}),
    description: metaDesc,
    openGraph: {
      ...(metaTitle ? { title: metaTitle } : {}),
      description: metaDesc,
      images,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      ...(metaTitle ? { title: metaTitle } : {}),
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
