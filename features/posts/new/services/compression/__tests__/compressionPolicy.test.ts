import {
    DIMENSIONS,
    MAX_INPUT_PIXELS,
    MIN_SIDE,
    CLIENT_WEBP_QUALITY,
    getCandidateTargets,
    compressPixels,
    getTargetSize,
} from '../compressionPolicy';

const bufferOfSize = (size: number) => new ArrayBuffer(size);

describe('constants', () => {
    it('mirrors the backend ladder', () => {
        expect(DIMENSIONS).toEqual([1920, 1440, 1200, 1080]);
        expect(CLIENT_WEBP_QUALITY).toBe(95);
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

describe('compressPixels', () => {
    type Img = { width: number; height: number; tag: string };
    const source: Img = { width: 4000, height: 3000, tag: 'src' };

    const makeCodec = (sizeOf: (image: Img, quality: number) => number = () => 50) => {
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

    it('resizes to the largest backend size and encodes once at CLIENT_WEBP_QUALITY', async () => {
        const codec = makeCodec();
        const result = await compressPixels(source, codec);
        expect(result.ok && result.value.byteLength).toBe(50);
        expect(codec.resize).toHaveBeenCalledTimes(1);
        expect(codec.resize).toHaveBeenCalledWith(source, 1920, 1440);
        expect(codec.encode).toHaveBeenCalledTimes(1);
        expect(codec.encode).toHaveBeenCalledWith(expect.objectContaining({ tag: '1920x1440' }), CLIENT_WEBP_QUALITY);
    });

    it('does not cap the output size: a large encode is still returned', async () => {
        const codec = makeCodec(() => 900 * 1024);
        const result = await compressPixels(source, codec);
        expect(result.ok && result.value.byteLength).toBe(900 * 1024);
    });

    it('does not resize a source that already matches the largest target', async () => {
        const codec = makeCodec();
        await compressPixels({ width: 1080, height: 1080, tag: 's' }, codec);
        expect(codec.resize).not.toHaveBeenCalled();
        expect(codec.encode).toHaveBeenCalledTimes(1);
    });

    it('propagates a codec rejection', async () => {
        const resize = async (s: Img) => s;
        const encode = async (): Promise<ArrayBuffer> => {
            throw new Error('wasm trap');
        };
        await expect(compressPixels({ width: 1080, height: 1080, tag: 's' }, { resize, encode })).rejects.toThrow(
            'wasm trap',
        );
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

