import pRetry, { AbortError } from 'p-retry';
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
const CHUNK_CONCURRENCY = 3;

// ── Resumability ──────────────────────────────────────────────────────────────

interface ResumeState {
  fileId: string;
  uploadedChunks: number[];
}

function resumeKey(file: File): string {
  return `upload:${file.name}:${file.size}:${file.lastModified}`;
}

function loadResumeState(file: File): ResumeState | null {
  try {
    const raw = localStorage.getItem(resumeKey(file));
    return raw ? (JSON.parse(raw) as ResumeState) : null;
  } catch {
    return null;
  }
}

function saveResumeState(file: File, state: ResumeState): void {
  try {
    localStorage.setItem(resumeKey(file), JSON.stringify(state));
  } catch {}
}

function clearResumeState(file: File): void {
  try {
    localStorage.removeItem(resumeKey(file));
  } catch {}
}

// ── Checksum ──────────────────────────────────────────────────────────────────

async function sha256Hex(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function isRetryable(status: number): boolean {
  return status === 0 || status === 429 || status >= 500;
}

// ── Chunk upload ──────────────────────────────────────────────────────────────

interface ChunkTask {
  fetcher: typeof fetch;
  fileId: string;
  filename: string;
  chunk: Blob;
  index: number;
  totalChunks: number;
  signal: AbortSignal;
  onDone: (index: number) => void;
}

async function uploadOneChunk(task: ChunkTask): Promise<void> {
  const { fetcher, fileId, filename, chunk, index, totalChunks, signal, onDone } = task;
  const checksum = await sha256Hex(chunk);

  await pRetry(
    async () => {
      const result = await Result.try(
        fetcher(
          `/api/upload/chunk?fileId=${fileId}&index=${index}&total=${totalChunks}&filename=${encodeURIComponent(filename)}`,
          {
            method: 'POST',
            body: chunk,
            signal,
            headers: { 'X-Chunk-Checksum': checksum },
          },
        ),
      );

      if (!result.ok) throw result.error;

      const { value: response } = result;

      if (response.ok) {
        onDone(index);
        return;
      }

      if (!isRetryable(response.status)) {
        throw new AbortError(`Chunk ${index} rejected: HTTP ${response.status}`);
      }

      throw new Error(`Chunk ${index} failed: HTTP ${response.status}`);
    },
    { retries: MAX_RETRIES, minTimeout: 1_000, factor: 2, signal },
  );
}

// ── Parallel runner ───────────────────────────────────────────────────────────

async function runParallel(tasks: ChunkTask[], concurrency: number): Promise<void> {
  const queue = [...tasks];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
      while (queue.length) {
        const task = queue.shift()!;
        await uploadOneChunk(task);
      }
    }),
  );
}

// ── Strategy factory ──────────────────────────────────────────────────────────

export function createChunkStrategy(
  fetcher: typeof fetch = fetch,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): UploadStrategy {
  return {
    async upload(id, file, onProgress, signal): Promise<string> {
      const totalChunks = Math.ceil(file.size / chunkSize) || 1;

      // 1. Load local resume state (survives page refresh via localStorage)
      const stored = loadResumeState(file);
      const fileId = stored?.fileId ?? id;
      const uploadedSet = new Set<number>(stored?.uploadedChunks ?? []);

      // 2. Sync with server — skip chunks the server already has
      if (stored?.fileId) {
        const res = await Result.try(
          fetcher(`/api/upload/${fileId}/chunks`, { signal }),
        );
        if (res.ok && res.value.ok) {
          const data = (await res.value.json()) as { received: number[] };
          for (const idx of data.received) uploadedSet.add(idx);
        }
      }

      saveResumeState(file, { fileId, uploadedChunks: [...uploadedSet] });

      // 3. Progress is driven by completed chunk count
      let completedCount = uploadedSet.size;
      const reportProgress = () => {
        onProgress(Math.round((completedCount / totalChunks) * 100));
      };
      reportProgress();

      // 4. Build task list — skip already-uploaded indices
      const tasks: ChunkTask[] = [];
      for (let i = 0; i < totalChunks; i++) {
        if (uploadedSet.has(i)) continue;
        const start = i * chunkSize;
        const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
        tasks.push({
          fetcher,
          fileId,
          filename: file.name,
          chunk,
          index: i,
          totalChunks,
          signal,
          onDone: (idx) => {
            uploadedSet.add(idx);
            completedCount++;
            saveResumeState(file, { fileId, uploadedChunks: [...uploadedSet] });
            reportProgress();
          },
        });
      }

      // 5. Upload remaining chunks with inner concurrency
      await runParallel(tasks, CHUNK_CONCURRENCY);

      // 6. Tell the server to assemble — removes the race condition in chunk counting
      const finalResult = await Result.try(
        fetcher(`/api/upload/${fileId}/finalize?total=${totalChunks}`, {
          method: 'POST',
          signal,
        }),
      );

      if (!finalResult.ok) throw finalResult.error;

      if (!finalResult.value.ok) {
        const body = (await finalResult.value.json()) as { error?: string };
        throw new Error(body.error ?? 'Finalize failed');
      }

      const { url } = (await finalResult.value.json()) as { url: string };
      clearResumeState(file);
      return url;
    },
  };
}
