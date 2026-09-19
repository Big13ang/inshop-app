import { env } from '@/env';

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
  _endpoint = `${env.NEXT_PUBLIC_API_URL}/uploads`,
): UploadStrategy {
  return {
    async upload(_params: UploadParams): Promise<string> {
      return '';
    },
  };
}
