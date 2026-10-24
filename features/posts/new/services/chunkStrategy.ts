import { getPublicApiUrl } from '@/lib/runtimeConfig';

export interface UploadParams {
  id: string;
  file: File;
  onProgress: (pct: number) => void;
  signal: AbortSignal;
  options?: { uploadSessionId?: string };
}

export interface UploadStrategy {
  upload(params: UploadParams): Promise<string>;
}

export function createChunkStrategy(
  _endpoint = `${getPublicApiUrl()}/uploads`,
): UploadStrategy {
  return {
    async upload(_params: UploadParams): Promise<string> {
      return '';
    },
  };
}
