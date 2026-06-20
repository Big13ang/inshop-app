import { type MediaItem, type MediaKind } from '../types';

export function buildMediaItem(file: File, mediaKind: MediaKind = 'image'): MediaItem {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    file,
    localUrl: URL.createObjectURL(file),
    status: 'queued',
    progress: 0,
    mediaKind,
  };
}
