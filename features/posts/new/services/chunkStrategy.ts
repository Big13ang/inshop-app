import { Result } from '@/lib/utils/result';

export interface UploadStrategy {
  upload(
    id: string,
    file: File,
    onProgress: (pct: number) => void,
    signal: AbortSignal,
  ): Promise<string>;
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

function isRetryable(status: number): boolean {
  return status === 0 || status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates uploading progress by slowly incrementing progress between start and target values.
 */
function startProgressSimulation(
  startProgress: number,
  targetProgress: number,
  onProgress: (pct: number) => void,
): { stop: () => void } {
  let currentProgress = startProgress;
  const interval = setInterval(() => {
    if (currentProgress < targetProgress) {
      currentProgress = Math.min(currentProgress + 2, targetProgress);
      onProgress(currentProgress);
    }
  }, 100);
  return { stop: () => clearInterval(interval) };
}

interface UploadChunkOptions {
  fetcher: typeof fetch;
  id: string;
  filename: string;
  chunk: Blob;
  index: number;
  totalChunks: number;
  startProgress: number;
  targetProgress: number;
  onProgress: (pct: number) => void;
  signal: AbortSignal;
}

/**
 * Handles the retry loop, signal abortion, progress simulation, and fetch logic for a single chunk.
 */
async function uploadChunk({
  fetcher,
  id,
  filename,
  chunk,
  index,
  totalChunks,
  startProgress,
  targetProgress,
  onProgress,
  signal,
}: UploadChunkOptions): Promise<Response> {
  let attempt = 0;

  while (true) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const simulation = startProgressSimulation(startProgress, targetProgress, onProgress);

    const result = await Result.try(
      fetcher(
        `/api/upload/chunk?fileId=${id}&index=${index}&total=${totalChunks}&filename=${encodeURIComponent(filename)}`,
        { method: 'POST', body: chunk, signal },
      ),
    );

    simulation.stop();

    if (!result.ok) {
      throw result.error;
    }

    const response = result.value;

    if (response.ok) {
      return response;
    }

    if (!isRetryable(response.status) || attempt >= MAX_RETRIES) {
      throw new Error(`Upload failed with HTTP ${response.status}`);
    }

    await delay(RETRY_DELAYS_MS[attempt] ?? 4_000);
    attempt++;
  }
}

export function createChunkStrategy(
  fetcher: typeof fetch = fetch,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): UploadStrategy {
  return {
    async upload(id, file, onProgress, signal): Promise<string> {
      const totalChunks = Math.ceil(file.size / chunkSize) || 1;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * chunkSize, Math.min((i + 1) * chunkSize, file.size));
        const startProgress = Math.round((i / totalChunks) * 100);
        const targetProgress = Math.round(((i + 0.9) / totalChunks) * 100);

        const response = await uploadChunk({
          fetcher,
          id,
          filename: file.name,
          chunk,
          index: i,
          totalChunks,
          startProgress,
          targetProgress,
          onProgress,
          signal,
        });

        const nextProgress = Math.round(((i + 1) / totalChunks) * 100);
        onProgress(nextProgress);

        if (i === totalChunks - 1) {
          const data = await response.json() as { url: string };
          return data.url;
        }
      }

      throw new Error('Unexpected end of upload loop');
    },
  };
}


