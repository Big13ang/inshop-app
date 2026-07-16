import { env } from '@/env';
import type { BackendMedia } from '../services/postsQueryService';

export function getMediaUrl(media: { url: string | null; storageKey: string } | BackendMedia): string {
  return media.url || `${env.NEXT_PUBLIC_CDN_URL}/${media.storageKey}`;
}
