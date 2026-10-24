import { Result } from '@/lib/utils/result';
import type { WorkerLike } from '../workerPool';

type PoolModule = typeof import('../compressionPool');

const mockCreateWorker = jest.fn<Result<WorkerLike, string>, []>();
jest.mock('../createCompressionWorker', () => ({
    createCompressionWorker: () => mockCreateWorker(),
}));

type G = Record<string, unknown>;
const g = globalThis as unknown as G;
const KEYS = ['Worker', 'createImageBitmap', 'WebAssembly', 'OffscreenCanvas'] as const;
const saved: G = {};

const makeWorker = (): WorkerLike => ({
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: null,
    onerror: null,
});

function installBrowserApis(ctor?: unknown) {
    g.Worker = class {};
    g.createImageBitmap = jest.fn();
    g.WebAssembly = {};
    g.OffscreenCanvas = ctor ?? jest.fn(() => ({ getContext: () => ({}) }));
}

function loadPool(): PoolModule {
    let loaded: PoolModule | undefined;
    jest.isolateModules(() => {
        loaded = require('../compressionPool');
    });
    if (!loaded) throw new Error('module did not load');
    return loaded;
}

function setNavigator(props: { cores?: number; memory?: number; ua?: string }) {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: props.cores ?? 8, configurable: true });
    Object.defineProperty(navigator, 'deviceMemory', { value: props.memory, configurable: true });
    Object.defineProperty(navigator, 'userAgent', {
        value: props.ua ?? 'Mozilla/5.0 Chrome/120.0 Safari/537.36',
        configurable: true,
    });
}

const file = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' });

describe('compressionPool', () => {
    beforeEach(() => {
        for (const key of KEYS) saved[key] = g[key];
        mockCreateWorker.mockReset();
        mockCreateWorker.mockImplementation(() => Result.ok(makeWorker()));
        installBrowserApis();
        setNavigator({});
    });

    afterEach(() => {
        for (const key of KEYS) g[key] = saved[key];
    });

    describe('isCompressionSupported', () => {
        it.each(KEYS)('is false when %s is missing', (key) => {
            installBrowserApis();
            delete g[key];
            expect(loadPool().isCompressionSupported()).toBe(false);
        });

        it('is false when getContext returns null', () => {
            installBrowserApis(jest.fn(() => ({ getContext: () => null })));
            expect(loadPool().isCompressionSupported()).toBe(false);
        });

        it('is false when the OffscreenCanvas constructor throws', () => {
            installBrowserApis(
                jest.fn(() => {
                    throw new Error('nope');
                }),
            );
            expect(loadPool().isCompressionSupported()).toBe(false);
        });

        it('is true when everything is present', () => {
            expect(loadPool().isCompressionSupported()).toBe(true);
        });

        it('caches the detection result', () => {
            const ctor = jest.fn(() => ({ getContext: () => ({}) }));
            installBrowserApis(ctor);
            const pool = loadPool();
            pool.isCompressionSupported();
            pool.isCompressionSupported();
            pool.isCompressionSupported();
            expect(ctor).toHaveBeenCalledTimes(1);
        });

        it('turns false once the pool is disabled by 3 construction failures', async () => {
            mockCreateWorker.mockImplementation(() => Result.err('csp'));
            const pool = loadPool();
            expect(pool.isCompressionSupported()).toBe(true);
            for (let i = 0; i < 3; i++) await pool.compressInWorker(file());
            expect(pool.isCompressionSupported()).toBe(false);
        });
    });

    describe('pool size (observed through workers created)', () => {
        async function workersCreatedFor(props: Parameters<typeof setNavigator>[0]) {
            setNavigator(props);
            const pool = loadPool();
            // Two concurrent jobs never complete, so the pool grows to its size.
            void pool.compressInWorker(file());
            void pool.compressInWorker(file());
            void pool.compressInWorker(file());
            return mockCreateWorker.mock.calls.length;
        }

        it('uses 1 worker with 4 or fewer cores', async () => {
            expect(await workersCreatedFor({ cores: 4, memory: 8 })).toBe(1);
        });

        it('uses 1 worker with deviceMemory of 4 or less', async () => {
            expect(await workersCreatedFor({ cores: 8, memory: 4 })).toBe(1);
        });

        it('uses 2 workers with 8 cores and 8 GB', async () => {
            expect(await workersCreatedFor({ cores: 8, memory: 8 })).toBe(2);
        });

        it('uses 1 worker on WebKit without deviceMemory', async () => {
            const safari =
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
            expect(await workersCreatedFor({ cores: 8, ua: safari })).toBe(1);
        });

        it('uses 2 workers on Chromium-style UAs without deviceMemory', async () => {
            const chrome =
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
            expect(await workersCreatedFor({ cores: 8, ua: chrome })).toBe(2);
        });
    });

    describe('prewarm and release', () => {
        it('prewarm creates a single worker when supported', () => {
            const pool = loadPool();
            pool.prewarmCompression();
            expect(mockCreateWorker).toHaveBeenCalledTimes(1);
        });

        it('prewarm does not create a pool when unsupported', () => {
            delete g.Worker;
            const pool = loadPool();
            pool.prewarmCompression();
            expect(mockCreateWorker).not.toHaveBeenCalled();
        });

        it('releaseIdle is a no-op before the pool exists', () => {
            const pool = loadPool();
            expect(() => pool.releaseIdleCompressionWorkers()).not.toThrow();
            expect(mockCreateWorker).not.toHaveBeenCalled();
        });

        it('releaseIdle terminates a prewarmed worker', () => {
            const worker = makeWorker();
            mockCreateWorker.mockReturnValue(Result.ok(worker));
            const pool = loadPool();
            pool.prewarmCompression();
            pool.releaseIdleCompressionWorkers();
            expect(worker.terminate).toHaveBeenCalledTimes(1);
        });
    });
});
