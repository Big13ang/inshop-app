import { createUuid } from '@/lib/utils';
import { type MediaItem, type MediaKind } from '../types';

export function buildMediaItem(
  file: File,
  mediaKind: MediaKind = 'image',
  validated = false,
): MediaItem {
  return {
    id: createUuid(),
    name: file.name,
    file,
    localUrl: URL.createObjectURL(file),
    status: 'queued',
    progress: 0,
    mediaKind,
    validated,
  };
}
