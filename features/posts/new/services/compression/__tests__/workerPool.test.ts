import { Result } from '@/lib/utils/result';
import {
    createWorkerPool,
    IDLE_TIMEOUT_MS,
    JOB_TIMEOUT_MS,
    type WorkerLike,
    type WorkerPool,
} from '../workerPool';
import type { CompressionRequest, CompressionResponse } from '../types';

class FakeWorker implements WorkerLike {
    static instances: FakeWorker[] = [];

    onmessage: WorkerLike['onmessage'] = null;
    onerror: WorkerLike['onerror'] = null;
    posted: CompressionRequest[] = [];
    terminated = false;

    constructor() {
        FakeWorker.instances.push(this);
    }

    postMessage(request: CompressionRequest) {
        this.posted.push(request);
    }

    terminate() {
        this.terminated = true;
    }

    respond(response: CompressionResponse) {
        this.onmessage?.({ data: response } as MessageEvent<CompressionResponse>);
    }

    fail() {
        this.onerror?.(new ErrorEvent('error'));
    }

    get lastJobId(): number {
        const jobs = this.posted.filter((r) => r.type === 'compress');
        const last = jobs[jobs.length - 1];
        if (last?.type !== 'compress') throw new Error('no job posted');
        return last.id;
    }

    succeed(bytes = 10) {
        this.respond({ type: 'compressed', id: this.lastJobId, ok: true, buffer: new ArrayBuffer(bytes) });
    }
}

const file = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' });

const makePool = (poolSize = 1, createWorker?: () => Result<WorkerLike, string>): WorkerPool =>
    createWorkerPool({
        createWorker: createWorker ?? (() => Result.ok(new FakeWorker())),
        getPoolSize: () => poolSize,
    });

const live = () => FakeWorker.instances.filter((w) => !w.terminated);

describe('workerPool', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        FakeWorker.instances = [];
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('resolves ok with the buffer on success', async () => {
        const pool = makePool();
        const promise = pool.compress(file());
        FakeWorker.instances[0].succeed(42);
        const result = await promise;
        expect(result.ok && result.value.byteLength).toBe(42);
    });

    it('resolves err when the worker reports a compression error', async () => {
        const pool = makePool();
        const promise = pool.compress(file());
        const worker = FakeWorker.instances[0];
        worker.respond({ type: 'compressed', id: worker.lastJobId, ok: false, error: 'bad' });
        const result = await promise;
        expect(!result.ok && result.error).toBe('bad');
        expect(pool.isDisabled()).toBe(false);
    });

    it('times out with err and disables compression for the session', async () => {
        const pool = makePool();
        const promise = pool.compress(file());
        jest.advanceTimersByTime(JOB_TIMEOUT_MS);
        const result = await promise;
        expect(!result.ok && result.error).toBe('timeout');
        expect(pool.isDisabled()).toBe(true);
        expect(FakeWorker.instances[0].terminated).toBe(true);

        const later = await pool.compress(file());
        expect(!later.ok && later.error).toBe('compression disabled');
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('fails queued jobs without spawning once disabled by a timeout', async () => {
        const pool = makePool(1);
        const first = pool.compress(file());
        const second = pool.compress(file());
        jest.advanceTimersByTime(JOB_TIMEOUT_MS);
        expect((await first).ok).toBe(false);
        const queued = await second;
        expect(!queued.ok && queued.error).toBe('compression disabled');
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('does not respawn a worker that errors with no job and never answered', () => {
        const pool = makePool(2);
        pool.prewarm();
        expect(FakeWorker.instances).toHaveLength(1);
        FakeWorker.instances[0].fail();
        expect(FakeWorker.instances).toHaveLength(1);
        expect(FakeWorker.instances[0].terminated).toBe(true);
    });

    it('respawns an idle worker that had answered before it errored', async () => {
        const pool = makePool(1);
        const promise = pool.compress(file());
        FakeWorker.instances[0].succeed();
        await promise;
        FakeWorker.instances[0].fail();
        expect(FakeWorker.instances).toHaveLength(2);
        expect(pool.isDisabled()).toBe(false);
    });

    it('resolves err when the worker errors with a job in flight, then respawns', async () => {
        const pool = makePool();
        const promise = pool.compress(file());
        FakeWorker.instances[0].fail();
        const result = await promise;
        expect(!result.ok && result.error).toBe('worker error');
        expect(FakeWorker.instances).toHaveLength(2);
        expect(live()).toHaveLength(1);
    });

    it('disables compression after 3 consecutive worker failures', async () => {
        const pool = makePool();
        for (let i = 0; i < 3; i++) {
            const promise = pool.compress(file());
            FakeWorker.instances[i].fail();
            expect((await promise).ok).toBe(false);
        }
        expect(pool.isDisabled()).toBe(true);
        expect(FakeWorker.instances).toHaveLength(3);
        expect(live()).toHaveLength(0);

        const later = await pool.compress(file());
        expect(!later.ok && later.error).toBe('compression disabled');
        pool.prewarm();
        expect(FakeWorker.instances).toHaveLength(3);
    });

    it('resets the failure counter after a successful response', async () => {
        const pool = makePool();
        const outcomes: Array<'fail' | 'ok'> = ['fail', 'fail', 'ok', 'fail', 'fail'];
        for (const outcome of outcomes) {
            const promise = pool.compress(file());
            const worker = live()[0];
            if (outcome === 'fail') worker.fail();
            else worker.succeed();
            await promise;
        }
        expect(pool.isDisabled()).toBe(false);
    });

    it('drains the queue through a single worker in order', async () => {
        const pool = makePool(1);
        const first = pool.compress(file());
        const second = pool.compress(file());
        const worker = FakeWorker.instances[0];
        expect(worker.posted.filter((r) => r.type === 'compress')).toHaveLength(1);

        worker.succeed(1);
        expect((await first).ok).toBe(true);
        expect(worker.posted.filter((r) => r.type === 'compress')).toHaveLength(2);

        worker.succeed(2);
        const result = await second;
        expect(result.ok && result.value.byteLength).toBe(2);
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('ignores a response carrying a stale job id', async () => {
        const pool = makePool();
        const promise = pool.compress(file());
        const worker = FakeWorker.instances[0];

        worker.respond({ type: 'compressed', id: 999, ok: true, buffer: new ArrayBuffer(1) });
        const raced = await Promise.race([promise, Promise.resolve('pending' as const)]);
        expect(raced).toBe('pending');

        worker.succeed(7);
        const result = await promise;
        expect(result.ok && result.value.byteLength).toBe(7);
    });

    it('resolves err when the worker cannot be constructed', async () => {
        const pool = makePool(1, () => Result.err('no module workers'));
        const result = await pool.compress(file());
        expect(!result.ok && result.error).toBe('worker unavailable');
    });

    it('terminates workers after the idle timeout and respawns on demand', async () => {
        const pool = makePool();
        const promise = pool.compress(file());
        FakeWorker.instances[0].succeed();
        await promise;

        jest.advanceTimersByTime(IDLE_TIMEOUT_MS);
        expect(FakeWorker.instances[0].terminated).toBe(true);

        const next = pool.compress(file());
        expect(FakeWorker.instances).toHaveLength(2);
        FakeWorker.instances[1].succeed();
        expect((await next).ok).toBe(true);
    });

    it('does not terminate a prewarmed worker that was never used', () => {
        const pool = makePool(1);
        pool.prewarm();
        jest.advanceTimersByTime(60_000);
        expect(FakeWorker.instances[0].terminated).toBe(false);
        expect(pool.isDisabled()).toBe(false);
    });

    it('arms the idle timer only after a job finishes', async () => {
        const pool = makePool(1);
        pool.prewarm();
        jest.advanceTimersByTime(60_000);
        const worker = FakeWorker.instances[0];
        expect(worker.terminated).toBe(false);

        const promise = pool.compress(file());
        worker.succeed();
        await promise;
        expect(worker.terminated).toBe(false);

        jest.advanceTimersByTime(IDLE_TIMEOUT_MS);
        expect(worker.terminated).toBe(true);
    });

    it('disables the pool after 3 consecutive worker construction failures', async () => {
        const factory = jest.fn(() => Result.err('csp blocked'));
        const pool = createWorkerPool({ createWorker: factory, getPoolSize: () => 1 });
        const first = await pool.compress(file());
        const second = await pool.compress(file());
        const third = await pool.compress(file());
        expect(!first.ok && first.error).toBe('worker unavailable');
        expect(!second.ok && second.error).toBe('worker unavailable');
        expect(!third.ok && third.error).toBe('compression disabled');
        expect(pool.isDisabled()).toBe(true);
        expect(factory).toHaveBeenCalledTimes(3);

        const later = await pool.compress(file());
        expect(!later.ok && later.error).toBe('compression disabled');
        expect(factory).toHaveBeenCalledTimes(3);
    });

    it('releaseIdle terminates idle workers but keeps busy ones', () => {
        const pool = makePool(2);
        void pool.compress(file());
        void pool.compress(file());
        FakeWorker.instances[1].succeed();
        pool.releaseIdle();
        expect(FakeWorker.instances.filter((w) => w.terminated)).toHaveLength(1);
        expect(live()).toHaveLength(1);
    });

    it('prewarm creates exactly one worker and posts a warmup, even for a larger pool', () => {
        const pool = makePool(2);
        pool.prewarm();
        expect(FakeWorker.instances).toHaveLength(1);
        expect(FakeWorker.instances[0].posted).toEqual([{ type: 'warmup' }]);
    });

    it('prewarm reuses the existing worker instead of creating another', () => {
        const pool = makePool(2);
        pool.prewarm();
        pool.prewarm();
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('prewarm is a no-op once disabled', async () => {
        const pool = makePool(1);
        const promise = pool.compress(file());
        jest.advanceTimersByTime(JOB_TIMEOUT_MS);
        await promise;
        pool.prewarm();
        expect(FakeWorker.instances).toHaveLength(1);
        expect(FakeWorker.instances[0].posted.filter((r) => r.type === 'warmup')).toHaveLength(0);
    });

    it('prewarm stops when construction fails', () => {
        const factory = jest.fn(() => Result.err('csp blocked'));
        const pool = createWorkerPool({ createWorker: factory, getPoolSize: () => 2 });
        pool.prewarm();
        expect(factory).toHaveBeenCalledTimes(1);
        expect(pool.isDisabled()).toBe(false);
    });

    it('compress after disable resolves without creating a worker', async () => {
        const factory = jest.fn(() => Result.ok(new FakeWorker()));
        const pool = createWorkerPool({ createWorker: factory, getPoolSize: () => 1 });
        const first = pool.compress(file());
        jest.advanceTimersByTime(JOB_TIMEOUT_MS);
        await first;
        factory.mockClear();
        const later = await pool.compress(file());
        expect(!later.ok && later.error).toBe('compression disabled');
        expect(factory).not.toHaveBeenCalled();
    });

    it('ignores a late message from a timed-out worker and never reaches a new job', async () => {
        const pool = makePool(1);
        const first = pool.compress(file());
        const stale = FakeWorker.instances[0];
        const staleId = stale.lastJobId;
        jest.advanceTimersByTime(JOB_TIMEOUT_MS);
        const result = await first;
        expect(!result.ok && result.error).toBe('timeout');

        // Handlers are detached on removal, so the late reply is dropped.
        expect(stale.onmessage).toBeNull();
        stale.onmessage?.({
            data: { type: 'compressed', id: staleId, ok: true, buffer: new ArrayBuffer(1) },
        } as MessageEvent<CompressionResponse>);
        expect(pool.isDisabled()).toBe(true);
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('a timeout on one worker lets the other finish its job (pool of 2)', async () => {
        const pool = makePool(2);
        const slow = pool.compress(file());
        const [workerA] = FakeWorker.instances;
        jest.advanceTimersByTime(JOB_TIMEOUT_MS - 1000);
        const fast = pool.compress(file());
        const workerB = FakeWorker.instances[1];
        jest.advanceTimersByTime(1000);

        const slowResult = await slow;
        expect(!slowResult.ok && slowResult.error).toBe('timeout');
        expect(workerA.terminated).toBe(true);
        expect(workerB.terminated).toBe(false);

        workerB.succeed(5);
        const fastResult = await fast;
        expect(fastResult.ok && fastResult.value.byteLength).toBe(5);
    });

    it('a worker-reported ok:false does not count toward the breaker', async () => {
        const pool = makePool(1);
        for (let i = 0; i < 5; i++) {
            const promise = pool.compress(file());
            const worker = FakeWorker.instances[0];
            worker.respond({ type: 'compressed', id: worker.lastJobId, ok: false, error: 'bad image' });
            await promise;
        }
        expect(pool.isDisabled()).toBe(false);
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('dispatches FIFO across two workers', async () => {
        const pool = makePool(2);
        const results = [pool.compress(file()), pool.compress(file()), pool.compress(file())];
        const [a, b] = FakeWorker.instances;
        const idA = a.lastJobId;
        const idB = b.lastJobId;
        expect(idA).toBeLessThan(idB);

        b.succeed(2);
        await results[1];
        // The third job goes to the worker that freed up first.
        expect(b.posted.filter((r) => r.type === 'compress')).toHaveLength(2);
        expect(a.posted.filter((r) => r.type === 'compress')).toHaveLength(1);
        a.succeed(1);
        b.succeed(3);
        expect((await Promise.all(results)).every((r) => r.ok)).toBe(true);
    });

    it('job ids stay unique across respawns', async () => {
        const pool = makePool(1);
        const ids: number[] = [];
        for (let i = 0; i < 2; i++) {
            const promise = pool.compress(file());
            const worker = live()[0];
            ids.push(worker.lastJobId);
            worker.fail();
            await promise;
        }
        const last = pool.compress(file());
        ids.push(live()[0].lastJobId);
        expect(new Set(ids).size).toBe(3);
        void last;
    });

    it('releaseIdle then compress respawns a worker', async () => {
        const pool = makePool(1);
        pool.prewarm();
        pool.releaseIdle();
        expect(FakeWorker.instances[0].terminated).toBe(true);

        const promise = pool.compress(file());
        expect(FakeWorker.instances).toHaveLength(2);
        FakeWorker.instances[1].succeed();
        expect((await promise).ok).toBe(true);
    });
});
