import { headers } from 'next/headers';
import { Result } from './result';

const CRAWLER_USER_AGENT_REGEX =
  /googlebot|google-inspectiontool|bingbot|bingpreview|yandex|duckduckbot|baiduspider|twitterbot|facebookexternalhit|facebot|telegrambot|whatsapp|slackbot|discordbot|linkedinbot|pinterest|applebot|crawler|spider/i;

/** Whether a User-Agent string belongs to a search engine crawler or link-preview bot. */
export function isCrawlerUserAgent(userAgent: string): boolean {
  return CRAWLER_USER_AGENT_REGEX.test(userAgent);
}

/**
 * Determines whether the current Server Component request originates from a
 * search engine crawler or social media link-preview bot.
 *
 * Crawlers require full SSR with OpenGraph meta tags, while human users
 * receive instant CSR shells with client-side cached data.
 */
export async function isCrawlerRequest(): Promise<boolean> {
  const headersResult = await Result.try(() => headers());
  if (!headersResult.ok) {
    return false;
  }
  return isCrawlerUserAgent(headersResult.value.get('user-agent') || '');
}
