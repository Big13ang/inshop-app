import { Result } from '@/lib/utils/result';

// Isolated from compressionPool.ts because `import.meta` cannot be parsed by Jest;
// tests mock this module instead.
export function createCompressionWorker(): Result<Worker, string> {
    const created = Result.trySync(
        () => new Worker(new URL('./compress.worker.ts', import.meta.url), { type: 'module' }),
    );
    return created.ok ? created : Result.err(String(created.error));
}
