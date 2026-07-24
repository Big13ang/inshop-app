export type MediaKind = 'image' | 'video';

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
