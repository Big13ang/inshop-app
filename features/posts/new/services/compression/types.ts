// Message contract shared by workerPool.ts (main thread) and compress.worker.ts.

export type CompressionRequest =
    | { type: 'warmup' }
    | { type: 'compress'; id: number; file: File };

export type CompressionResponse =
    | { type: 'compressed'; id: number; ok: true; buffer: ArrayBuffer }
    | { type: 'compressed'; id: number; ok: false; error: string };
