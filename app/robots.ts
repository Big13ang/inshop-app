import type { MetadataRoute } from 'next';
import { isDevEnvironment } from '@/lib/utils/metadata';

export default function robots(): MetadataRoute.Robots {
  if (isDevEnvironment()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inshop.social';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/auth/', '/api/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
