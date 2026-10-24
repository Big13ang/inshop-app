/** @jest-environment node */
jest.mock('../createCompressionWorker', () => ({
    createCompressionWorker: () => ({ ok: false, error: 'not in ssr' }),
}));

describe('compressionPool on the server', () => {
    it('imports without touching browser globals', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof navigator === 'undefined' || typeof document === 'undefined').toBe(true);
        expect(() => require('../compressionPool')).not.toThrow();
    });

    it('reports unsupported and prewarm/release are safe no-ops', () => {
        const pool = require('../compressionPool') as typeof import('../compressionPool');
        expect(pool.isCompressionSupported()).toBe(false);
        expect(() => pool.prewarmCompression()).not.toThrow();
        expect(() => pool.releaseIdleCompressionWorkers()).not.toThrow();
    });
});
