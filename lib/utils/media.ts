import { env } from '@/env';

export type MediaKind = 'image' | 'video';

export type MediaInput =
  | { id?: string | null; url?: string | null; storageKey?: string | null }
  | string
  | null
  | undefined;

/**
 * Determines whether a file (or MIME string) represents an image or video.
 * Defaults to 'image'.
 */
export function getMediaKind(fileOrMime: File | string): MediaKind {
  const mimeType = typeof fileOrMime === 'string' ? fileOrMime : fileOrMime.type;
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'image';
}

/**
 * Resolves a media key or media object to a full URL.
 * - If given a full URL (http:// or https://), returns it as-is.
 * - If given a relative key/path, prepends NEXT_PUBLIC_CDN_URL.
 * - Returns empty string if media is null/undefined/empty.
 */
export function getMediaUrl(media?: MediaInput): string {
  if (!media) return '';

  const formatKey = (key: string): string => {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    const rawBaseUrl = process.env.NEXT_PUBLIC_CDN_URL !== undefined
      ? process.env.NEXT_PUBLIC_CDN_URL
      : env.NEXT_PUBLIC_CDN_URL;
    const baseUrl = (rawBaseUrl || '').replace(/\/+$/, '');
    const cleanKey = key.replace(/^\/+/, '');
    return baseUrl ? `${baseUrl}/${cleanKey}` : cleanKey;
  };

  if (typeof media === 'string') {
    return formatKey(media);
  }

  if (media.url) {
    return formatKey(media.url);
  }

  if (media.storageKey) {
    return formatKey(media.storageKey);
  }

  if (media.id) {
    return formatKey(media.id);
  }

  return '';
}

