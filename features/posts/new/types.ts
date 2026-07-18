export interface SelectedFile {
  id: string;
  url: string;
  file: File;
  type: 'image' | 'video';
}

export type MediaKind = 'image' | 'video';

export type MediaStatus = 'queued' | 'uploading' | 'uploaded' | 'failed' | 'cancelled';

export interface MediaItem {
  id: string;
  name: string;
  file: File | null;
  localUrl: string;
  status: MediaStatus;
  progress: number;
  mediaKind: MediaKind;
  validated: boolean;
  uploadedUrl?: string;
}
