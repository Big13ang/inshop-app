import { Result } from '@/lib/utils/result';
import type { CompressionRequest, CompressionResponse } from './types';

export const JOB_TIMEOUT_MS = 8000;
export const IDLE_TIMEOUT_MS = 30_000;
export const MAX_CONSECUTIVE_FAILURES = 3;

export type JobResult = Result<ArrayBuffer, string>;

/** The subset of `Worker` the pool uses; lets tests inject a fake. */
export type WorkerLike = {
    postMessage(request: CompressionRequest): void;
    terminate(): void;
    onmessage: ((event: MessageEvent<CompressionResponse>) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
};

export type WorkerPoolDeps = {
    createWorker: () => Result<WorkerLike, string>;
    getPoolSize: () => number;
    jobTimeoutMs?: number;
    idleTimeoutMs?: number;
    maxConsecutiveFailures?: number;
};

export type WorkerPool = {
    compress(file: File): Promise<JobResult>;
    prewarm(): void;
    /** Terminates workers that have no job in flight. */
    releaseIdle(): void;
    isDisabled(): boolean;
};

type Job = {
    id: number;
    file: File;
    resolve: (result: JobResult) => void;
};

type Slot = {
    worker: WorkerLike;
    job: Job | null;
    /** True once the worker has posted at least one message back. */
    hasResponded: boolean;
    jobTimer: ReturnType<typeof setTimeout> | null;
    idleTimer: ReturnType<typeof setTimeout> | null;
};

export function createWorkerPool(deps: WorkerPoolDeps): WorkerPool {
    const jobTimeoutMs = deps.jobTimeoutMs ?? JOB_TIMEOUT_MS;
    const idleTimeoutMs = deps.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
    const maxFailures = deps.maxConsecutiveFailures ?? MAX_CONSECUTIVE_FAILURES;

    const slots: Slot[] = [];
    const queue: Job[] = [];
    let nextJobId = 1;
    let consecutiveFailures = 0;
    let disabled = false;

    function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
        if (timer) clearTimeout(timer);
    }

    function failQueue(error: string) {
        for (const job of queue.splice(0)) job.resolve(Result.err(error));
    }

    function removeSlot(slot: Slot) {
        clearTimer(slot.jobTimer);
        clearTimer(slot.idleTimer);
        slot.jobTimer = null;
        slot.idleTimer = null;
        slot.worker.onmessage = null;
        slot.worker.onerror = null;
        slot.worker.terminate();
        const index = slots.indexOf(slot);
        if (index !== -1) slots.splice(index, 1);
    }

    function releaseIdle() {
        for (const slot of [...slots]) {
            if (slot.job === null) removeSlot(slot);
        }
    }

    function disable() {
        disabled = true;
        failQueue('compression disabled');
        releaseIdle();
    }

    function scheduleIdleShutdown(slot: Slot) {
        clearTimer(slot.idleTimer);
        slot.idleTimer = setTimeout(() => removeSlot(slot), idleTimeoutMs);
    }

    function finishJob(slot: Slot, result: JobResult) {
        const job = slot.job;
        clearTimer(slot.jobTimer);
        slot.jobTimer = null;
        slot.job = null;
        job?.resolve(result);
    }

    function recordFailure() {
        consecutiveFailures += 1;
        if (consecutiveFailures >= maxFailures) disable();
    }

    function failSlot(slot: Slot, error: string) {
        // A worker that never answered and had no job is most likely failing to
        // load at all; respawning it would loop forever.
        const shouldRespawn = slot.job !== null || slot.hasResponded;
        finishJob(slot, Result.err(error));
        removeSlot(slot);
        recordFailure();

        if (shouldRespawn) addSlot();
        dispatch();
    }

    function handleTimeout(slot: Slot) {
        // A slow device will time out again on every image: stop for the session.
        disable();
        failSlot(slot, 'timeout');
    }

    function handleWorkerMessage(slot: Slot, response: CompressionResponse) {
        slot.hasResponded = true;
        if (response.type !== 'compressed' || slot.job?.id !== response.id) return;

        if (response.ok) {
            consecutiveFailures = 0;
            finishJob(slot, Result.ok(response.buffer));
        } else {
            finishJob(slot, Result.err(response.error));
        }
        scheduleIdleShutdown(slot);
        dispatch();
    }

    function handleWorkerError(slot: Slot) {
        failSlot(slot, 'worker error');
    }

    function attachHandlers(slot: Slot) {
        slot.worker.onmessage = (event) => handleWorkerMessage(slot, event.data);
        slot.worker.onerror = () => handleWorkerError(slot);
    }

    function addSlot(): Slot | null {
        if (disabled) return null;

        const created = deps.createWorker();
        if (!created.ok) {
            recordFailure();
            return null;
        }

        const slot: Slot = {
            worker: created.value,
            job: null,
            hasResponded: false,
            jobTimer: null,
            idleTimer: null,
        };
        slots.push(slot);
        attachHandlers(slot);
        // The idle timer is armed only once a job finishes, so prewarmed workers
        // that are never used are not terminated while the page is mounted.
        return slot;
    }

    function startJob(slot: Slot, job: Job) {
        clearTimer(slot.idleTimer);
        slot.idleTimer = null;
        slot.job = job;
        slot.jobTimer = setTimeout(() => handleTimeout(slot), jobTimeoutMs);
        slot.worker.postMessage({ type: 'compress', id: job.id, file: job.file });
    }

    function acquireSlot(): Slot | null {
        const idle = slots.find((slot) => slot.job === null);
        if (idle) return idle;
        return slots.length < deps.getPoolSize() ? addSlot() : null;
    }

    function dispatch() {
        while (queue.length > 0) {
            if (disabled) {
                failQueue('compression disabled');
                return;
            }
            const slot = acquireSlot();
            if (!slot) {
                // No worker could be created and none exist: avoid a stuck queue.
                if (slots.length === 0) failQueue('worker unavailable');
                return;
            }
            const job = queue.shift();
            if (!job) return;
            startJob(slot, job);
        }
    }

    function compress(file: File): Promise<JobResult> {
        if (disabled) return Promise.resolve(Result.err('compression disabled'));
        return new Promise((resolve) => {
            queue.push({ id: nextJobId++, file, resolve });
            dispatch();
        });
    }

    // Warms a single worker; compress jobs add more on demand up to getPoolSize().
    function prewarm() {
        if (disabled) return;
        if (slots.length === 0 && !addSlot()) return;
        slots[0]?.worker.postMessage({ type: 'warmup' });
    }

    return { compress, prewarm, releaseIdle, isDisabled: () => disabled };
}
