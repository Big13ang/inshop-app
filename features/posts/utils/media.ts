import { env } from '@/env';
import type { BackendMedia } from '../services/postsQueryService';

export function getMediaUrl(
  media?: { url?: string | null; storageKey?: string | null } | BackendMedia | null
): string {
  if (!media) return '';
  if (media.url) return media.url;
  if (!media.storageKey) return '';
  const baseUrl = (env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');
  const key = media.storageKey.replace(/^\/+/, '');
  return `${baseUrl}/${key}`;
}

