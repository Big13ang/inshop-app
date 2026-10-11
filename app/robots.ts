import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isDevEnvironment } from '@/lib/utils/metadata';
import { Result } from '@/lib/utils/result';

export function parseHostname(urlOrHost?: string | null): string | null {
  if (!urlOrHost) return null;
  const withoutProtocol = urlOrHost.includes('://')
    ? urlOrHost.split('://')[1]
    : urlOrHost;
  const hostWithoutPath = withoutProtocol.split('/')[0];
  const hostWithoutPort = hostWithoutPath.split(':')[0];
  const cleaned = hostWithoutPort.toLowerCase().trim();
  return cleaned || null;
}

export function isAllowedProductionHost(host?: string | null): boolean {
  const cleanHost = parseHostname(host);
  return cleanHost === 'inshop.social' || cleanHost === 'www.inshop.social';
}

function resolveHost(headersHost?: string | null): string | null {
  if (headersHost) {
    return parseHostname(headersHost);
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return parseHostname(process.env.NEXT_PUBLIC_APP_URL);
  }
  return null;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersResult = await Result.try(() => headers());
  const headerHost = headersResult.ok
    ? headersResult.value.get('x-forwarded-host') || headersResult.value.get('host')
    : null;

  const currentHost = resolveHost(headerHost);

  // If in dev environment OR on any subdomain (e.g. dev.inshop.social, staging.inshop.social), block all crawlers
  if (isDevEnvironment() || (currentHost && !isAllowedProductionHost(currentHost))) {
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
      disallow: ['/app/', '/auth/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
