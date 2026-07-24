export type SelectedFile = {
  id: string;
  url: string;
  file: File;
}

export type MediaKind = "image" | "video";

export type MediaStatus =
  "queued" | "pending" | "uploading" | "uploaded" | "failed";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  uploadProgress: number;
  order: null | number;
  previewUrl: null | string;
  file: File;
  isValid: boolean;
};