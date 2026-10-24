import { Result } from '@/lib/utils/result';
import { createCompressionWorker } from './createCompressionWorker';
import { createWorkerPool, type JobResult, type WorkerPool } from './workerPool';

let pool: WorkerPool | null = null;
let browserSupport: boolean | null = null;

function hasDeviceMemory(nav: Navigator): nav is Navigator & { deviceMemory: number } {
    return 'deviceMemory' in nav && typeof nav.deviceMemory === 'number';
}

// Safari/WebKit (incl. iOS browsers) never exposes deviceMemory and has the tightest
// memory limits, so an unknown memory size there is treated as low. Chromium-based
// UAs also contain "AppleWebKit" but always add "Chrome/", "Chromium/" or "Edg/".
function isWebKit(nav: Navigator): boolean {
    return /AppleWebKit/.test(nav.userAgent) && !/(Chrome|Chromium|Edg)\//.test(nav.userAgent);
}

function getPoolSize(): number {
    const lowCores = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
    const lowMemory = hasDeviceMemory(navigator)
        ? navigator.deviceMemory <= 4
        : isWebKit(navigator);
    return lowCores || lowMemory ? 1 : 2;
}

function getPool(): WorkerPool {
    pool ??= createWorkerPool({ createWorker: createCompressionWorker, getPoolSize });
    return pool;
}

function detectBrowserSupport(): boolean {
    if (typeof Worker === 'undefined') return false;
    if (typeof createImageBitmap === 'undefined') return false;
    if (typeof WebAssembly === 'undefined') return false;
    if (typeof OffscreenCanvas === 'undefined') return false;
    const context = Result.trySync(() => new OffscreenCanvas(1, 1).getContext('2d'));
    return context.ok && context.value !== null;
}

// Computed on first call (always in the browser), then cached.
function hasBrowserSupport(): boolean {
    browserSupport ??= detectBrowserSupport();
    return browserSupport;
}

export function isCompressionSupported(): boolean {
    if (pool?.isDisabled()) return false;
    return hasBrowserSupport();
}

export function compressInWorker(file: File): Promise<JobResult> {
    return getPool().compress(file);
}

export function prewarmCompression() {
    if (!isCompressionSupported()) return;
    getPool().prewarm();
}

/** Terminates idle workers (e.g. when leaving the new-post page). */
export function releaseIdleCompressionWorkers() {
    pool?.releaseIdle();
}
