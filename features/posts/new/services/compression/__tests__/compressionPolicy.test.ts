import {
    DIMENSIONS,
    QUALITIES,
    MAX_TARGET_SIZE_BYTES,
    MAX_INPUT_PIXELS,
    MIN_SIDE,
    getCandidateTargets,
    compressPixels,
    getTargetSize,
    searchBestQuality,
} from '../compressionPolicy';

const bufferOfSize = (size: number) => new ArrayBuffer(size);

describe('constants', () => {
    it('mirrors the backend ladder', () => {
        expect(DIMENSIONS).toEqual([1920, 1440, 1200, 1080]);
        expect(QUALITIES).toEqual([80, 65, 50, 35, 20]);
        expect(MAX_TARGET_SIZE_BYTES).toBe(100 * 1024);
        expect(MAX_INPUT_PIXELS).toBe(40_000_000);
        expect(MIN_SIDE).toBe(1080);
    });
});

const hasRepeats = (targets: { width: number; height: number }[]) =>
    new Set(targets.map((t) => `${t.width}x${t.height}`)).size !== targets.length;

describe('getCandidateTargets', () => {
    it('never repeats a width x height for a 4000x3000 photo', () => {
        const targets = getCandidateTargets(4000, 3000);
        expect(hasRepeats(targets)).toBe(false);
        expect(targets).toEqual([
            { width: 1920, height: 1440 },
            { width: 1440, height: 1080 },
        ]);
    });

    it('never repeats for a 1080x1920 portrait', () => {
        const targets = getCandidateTargets(1080, 1920);
        expect(hasRepeats(targets)).toBe(false);
        expect(targets).toEqual([{ width: 1080, height: 1920 }]);
    });

    it('never repeats for a 2:1 panorama', () => {
        const targets = getCandidateTargets(4000, 2000);
        expect(hasRepeats(targets)).toBe(false);
        expect(targets).toEqual([{ width: 2160, height: 1080 }]);
    });

    it('returns a single target for small images', () => {
        expect(getCandidateTargets(1080, 1080)).toEqual([{ width: 1080, height: 1080 }]);
    });

    it('keeps distinct sizes ordered largest first', () => {
        expect(getCandidateTargets(1300, 1100)).toEqual([
            { width: 1300, height: 1100 },
            { width: 1276, height: 1080 },
        ]);
    });
});

describe('getTargetSize', () => {
    it('fits inside d x d without upscaling', () => {
        expect(getTargetSize(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
        expect(getTargetSize(3000, 4000, 1920)).toEqual({ width: 1440, height: 1920 });
        expect(getTargetSize(1500, 1500, 1920)).toEqual({ width: 1500, height: 1500 });
    });

    it('keeps the short side at 1080 for a 2:1 panorama', () => {
        expect(getTargetSize(4000, 2000, 1920)).toEqual({ width: 2160, height: 1080 });
        expect(getTargetSize(2000, 4000, 1080)).toEqual({ width: 1080, height: 2160 });
    });

    it('never upscales beyond the original', () => {
        expect(getTargetSize(1200, 1100, 1080)).toEqual({ width: 1178, height: 1080 });
        expect(getTargetSize(1080, 1080, 1080)).toEqual({ width: 1080, height: 1080 });
    });

    it('returns integers', () => {
        const { width, height } = getTargetSize(4032, 3024, 1440);
        expect(Number.isInteger(width)).toBe(true);
        expect(Number.isInteger(height)).toBe(true);
    });
});

describe('searchBestQuality', () => {
    const makeSizeFn = (sizes: Record<number, number>) => (quality: number) => sizes[quality];

    const linearScan = (sizeOf: (q: number) => number, target: number) =>
        QUALITIES.find((q) => sizeOf(q) <= target) ?? null;

    const scenarios: Record<number, number>[] = [
        { 80: 50, 65: 40, 50: 30, 35: 20, 20: 10 },
        { 80: 200, 65: 90, 50: 80, 35: 60, 20: 40 },
        { 80: 200, 65: 190, 50: 120, 35: 101, 20: 99 },
        { 80: 300, 65: 250, 50: 200, 35: 150, 20: 100 },
        { 80: 300, 65: 250, 50: 200, 35: 150, 20: 101 },
        { 80: 100, 65: 100, 50: 100, 35: 100, 20: 100 },
    ];

    it.each(scenarios.map((s, i) => [i, s] as const))(
        'matches a linear scan (scenario %i)',
        async (_i, sizes) => {
            const target = 100;
            const sizeOf = makeSizeFn(sizes);
            const calls: number[] = [];
            const encode = async (q: number) => {
                calls.push(q);
                return bufferOfSize(sizeOf(q));
            };

            const { fit } = await searchBestQuality(encode, target);
            const expected = linearScan(sizeOf, target);

            expect(fit?.quality ?? null).toBe(expected);
            expect(calls.length).toBeLessThanOrEqual(3);
        },
    );

    it('returns null fit and tracks the smallest encode when nothing fits', async () => {
        const sizeOf = makeSizeFn({ 80: 500, 65: 400, 50: 300, 35: 250, 20: 200 });
        const { fit, smallest } = await searchBestQuality(
            async (q) => bufferOfSize(sizeOf(q)),
            100,
        );
        expect(fit).toBeNull();
        expect(smallest?.quality).toBe(20);
        expect(smallest?.buffer.byteLength).toBe(200);
    });

    it('tracks the smallest encode seen even when a fit exists', async () => {
        const sizeOf = makeSizeFn({ 80: 500, 65: 90, 50: 80, 35: 70, 20: 60 });
        const { fit, smallest } = await searchBestQuality(
            async (q) => bufferOfSize(sizeOf(q)),
            100,
        );
        expect(fit?.quality).toBe(65);
        expect(smallest).not.toBeNull();
        expect(smallest!.buffer.byteLength).toBeLessThanOrEqual(fit!.buffer.byteLength);
    });
});

describe('compressPixels', () => {
    type Img = { width: number; height: number; tag: string };
    const source: Img = { width: 4000, height: 3000, tag: 'src' };

    const makeCodec = (sizeOf: (image: Img, quality: number) => number) => {
        const resize = jest.fn(async (_s: Img, width: number, height: number) => ({
            width,
            height,
            tag: `${width}x${height}`,
        }));
        const encode = jest.fn(async (image: Img, quality: number) =>
            bufferOfSize(sizeOf(image, quality)),
        );
        return { resize, encode };
    };

    it('returns the first quality that fits at the largest size', async () => {
        const codec = makeCodec(() => 50);
        const result = await compressPixels(source, codec, 100);
        expect(result.ok && result.value.byteLength).toBe(50);
        expect(codec.resize).toHaveBeenCalledTimes(1);
        expect(codec.resize).toHaveBeenCalledWith(source, 1920, 1440);
    });

    it('falls to a later size when only it fits', async () => {
        const codec = makeCodec((image) => (image.tag === '1440x1080' ? 60 : 500));
        const result = await compressPixels(source, codec, 100);
        expect(result.ok && result.value.byteLength).toBe(60);
        expect(codec.resize).toHaveBeenCalledTimes(2);
    });

    it('finds a lower quality that fits when only later qualities do', async () => {
        const sizes: Record<number, number> = { 80: 300, 65: 250, 50: 200, 35: 150, 20: 90 };
        const codec = makeCodec((_i, q) => sizes[q]);
        const result = await compressPixels(source, codec, 100);
        expect(result.ok && result.value.byteLength).toBe(90);
    });

    it('returns the smallest encode when nothing fits', async () => {
        const codec = makeCodec((image, q) => (image.tag === '1440x1080' ? 300 + q : 500 + q));
        const result = await compressPixels(source, codec, 100);
        expect(result.ok && result.value.byteLength).toBe(320);
    });

    it('does not resize or re-encode a repeated size', async () => {
        const codec = makeCodec(() => 500);
        await compressPixels({ width: 1080, height: 1920, tag: 'src' }, codec, 100);
        expect(codec.resize).not.toHaveBeenCalled();
        expect(codec.encode.mock.calls.length).toBeLessThanOrEqual(3);
    });
});

describe('target size invariants', () => {
    it.each(DIMENSIONS)('leaves 1080x1080 unchanged for rung %i', (rung) => {
        expect(getTargetSize(1080, 1080, rung)).toEqual({ width: 1080, height: 1080 });
    });

    it('keeps every candidate within [MIN_SIDE, source], without duplicates', () => {
        for (let width = MIN_SIDE; width <= 8000; width += 173) {
            for (let height = MIN_SIDE; height <= 8000; height += 191) {
                if (width * height > MAX_INPUT_PIXELS) continue;
                const targets = getCandidateTargets(width, height);
                expect(targets.length).toBeGreaterThan(0);
                expect(hasRepeats(targets)).toBe(false);
                for (const target of targets) {
                    if (
                        Math.min(target.width, target.height) < MIN_SIDE ||
                        target.width > width ||
                        target.height > height
                    ) {
                        throw new Error(`bad target ${target.width}x${target.height} for ${width}x${height}`);
                    }
                }
            }
        }
    });

    it.each([
        [800, 2000],
        [2000, 500],
        [500, 500],
        [1079, 4000],
    ])('never upscales a %ix%i source with a side below 1080', (width, height) => {
        for (const target of getCandidateTargets(width, height)) {
            expect(target.width).toBeLessThanOrEqual(width);
            expect(target.height).toBeLessThanOrEqual(height);
        }
    });
});

describe('searchBestQuality boundaries', () => {
    it('treats an encode of exactly maxBytes as fitting', async () => {
        const { fit } = await searchBestQuality(async () => bufferOfSize(100), 100);
        expect(fit?.quality).toBe(QUALITIES[0]);
    });

    it('does not treat maxBytes + 1 as fitting', async () => {
        const { fit } = await searchBestQuality(async () => bufferOfSize(101), 100);
        expect(fit).toBeNull();
    });
});

describe('compressPixels edge cases', () => {
    type Img = { width: number; height: number; tag: string };

    it('does not call resize when the first target equals the source', async () => {
        const resize = jest.fn(async (_s: Img, width: number, height: number) => ({ width, height, tag: 'r' }));
        const encode = jest.fn(async () => bufferOfSize(50));
        const result = await compressPixels({ width: 1080, height: 1080, tag: 's' }, { resize, encode }, 100);
        expect(resize).not.toHaveBeenCalled();
        expect(result.ok && result.value.byteLength).toBe(50);
    });

    it('returns the smallest encode across all targets, not just the last', async () => {
        const sizeByTag: Record<string, number> = { '1920x1536': 900, '1440x1152': 300, '1350x1080': 700 };
        const resize = async (_s: Img, width: number, height: number) => ({
            width,
            height,
            tag: `${width}x${height}`,
        });
        const encode = async (image: Img) => bufferOfSize(sizeByTag[image.tag]);
        const result = await compressPixels({ width: 5000, height: 4000, tag: 's' }, { resize, encode }, 100);
        expect(result.ok && result.value.byteLength).toBe(300);
    });

    it('propagates a codec rejection', async () => {
        const resize = async (source: Img) => source;
        const encode = async (): Promise<ArrayBuffer> => {
            throw new Error('wasm trap');
        };
        await expect(
            compressPixels({ width: 1080, height: 1080, tag: 's' }, { resize, encode }, 100),
        ).rejects.toThrow('wasm trap');
    });
});
