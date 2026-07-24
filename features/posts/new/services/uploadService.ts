import { type MediaItem } from '../types';
import { type UploadStrategy, createChunkStrategy } from './chunkStrategy';

export interface UploadService {
  enqueue(items: MediaItem[]): void;
  cancel(id: string): void;
  retry(id: string): void;
  cancelAll(): void;
}

export function createUploadService(
  _strategy: UploadStrategy = createChunkStrategy(),
  _concurrency = 3,
): UploadService {
  return {
    enqueue(_items: MediaItem[]): void {},
    cancel(_id: string): void {},
    retry(_id: string): void {},
    cancelAll(): void {},
  };
}
