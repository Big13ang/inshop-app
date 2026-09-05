import { env } from '@/env';

export type MediaKind = 'image' | 'video';

export type MediaInput =
  | {
      id?: string | null;
      url?: string | null;
      storageKey?: string | null;
      thumbnailStorageKey?: string | null;
      thumbnailUrl?: string | null;
    }
  | string
  | null
  | undefined;

/**
 * Formats a storage key or URL into a fully-qualified CDN URL.
 */
function formatKey(key: string): string {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  const baseUrl = (env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return baseUrl ? `${baseUrl}/${cleanKey}` : cleanKey;
}

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

/**
 * Resolves a media item's thumbnail to a full URL.
 * - Prioritizes thumbnailStorageKey formatted with CDN URL.
 * - Falls back to getMediaUrl (storageKey, url, id) if thumbnailStorageKey is absent.
 */
export function getThumbnailUrl(media?: MediaInput): string {
  if (!media) return '';

  if (typeof media === 'string') {
    return formatKey(media);
  }

  if (media.thumbnailStorageKey) {
    return formatKey(media.thumbnailStorageKey);
  }

  if (media.thumbnailUrl) {
    return formatKey(media.thumbnailUrl);
  }

  return getMediaUrl(media);
}

