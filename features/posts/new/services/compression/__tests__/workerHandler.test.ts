import { Result } from '@/lib/utils/result';
import { MAX_INPUT_PIXELS, type PixelCodec } from '../compressionPolicy';
import { createRequestHandler, decodePixels } from '../workerHandler';
import type { CompressionResponse } from '../types';

type Img = { width: number; height: number };

const file = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' });
const image: Img = { width: 1080, height: 1080 };

function makeHandler(overrides: {
    decode?: (f: File) => Promise<Result<Img, string>>;
    codec?: PixelCodec<Img>;
    initCodecs?: () => Promise<unknown>;
} = {}) {
    const post = jest.fn<void, [CompressionResponse, Transferable[]?]>();
    const initCodecs = overrides.initCodecs ?? jest.fn(async () => undefined);
    const codec: PixelCodec<Img> = overrides.codec ?? {
        resize: async (source) => source,
        encode: async () => new ArrayBuffer(10),
    };
    const decode = overrides.decode ?? (async () => Result.ok(image));
    const handle = createRequestHandler({ decode, codec, initCodecs, post });
    return { handle, post, initCodecs };
}

describe('createRequestHandler', () => {
    it('warmup initialises codecs once and posts nothing', async () => {
        const { handle, post, initCodecs } = makeHandler();
        await handle({ type: 'warmup' });
        expect(initCodecs).toHaveBeenCalledTimes(1);
        expect(post).not.toHaveBeenCalled();
    });

    it('warmup is idempotent, including concurrent calls', async () => {
        const { handle, initCodecs } = makeHandler();
        await Promise.all([handle({ type: 'warmup' }), handle({ type: 'warmup' })]);
        await handle({ type: 'warmup' });
        expect(initCodecs).toHaveBeenCalledTimes(1);
    });

    it('a failed init does not reject and can be retried by a later warmup', async () => {
        const initCodecs = jest
            .fn<Promise<unknown>, []>()
            .mockRejectedValueOnce(new Error('wasm blocked'))
            .mockResolvedValue(undefined);
        const { handle } = makeHandler({ initCodecs });
        await expect(handle({ type: 'warmup' })).resolves.toBeUndefined();
        await handle({ type: 'warmup' });
        expect(initCodecs).toHaveBeenCalledTimes(2);
    });

    it('posts the buffer with ok:true and transfers it', async () => {
        const { handle, post } = makeHandler();
        await handle({ type: 'compress', id: 7, file: file() });

        expect(post).toHaveBeenCalledTimes(1);
        const [response, transfer] = post.mock.calls[0];
        expect(response).toMatchObject({ type: 'compressed', id: 7, ok: true });
        const buffer = response.ok ? response.buffer : null;
        expect(buffer?.byteLength).toBe(10);
        expect(transfer).toEqual([buffer]);
    });

    it('posts ok:false when decoding fails', async () => {
        const { handle, post } = makeHandler({ decode: async () => Result.err('cannot decode') });
        await handle({ type: 'compress', id: 1, file: file() });
        expect(post).toHaveBeenCalledWith({ type: 'compressed', id: 1, ok: false, error: 'cannot decode' });
    });

    it('posts ok:false when the codec throws, without an unhandled rejection', async () => {
        const codec: PixelCodec<Img> = {
            resize: async (source) => source,
            encode: async () => {
                throw new Error('wasm trap');
            },
        };
        const { handle, post } = makeHandler({ codec });
        await expect(handle({ type: 'compress', id: 2, file: file() })).resolves.toBeUndefined();
        expect(post).toHaveBeenCalledWith({ type: 'compressed', id: 2, ok: false, error: 'wasm trap' });
    });
});

describe('decodePixels', () => {
    type Globals = {
        createImageBitmap?: unknown;
        OffscreenCanvas?: unknown;
    };
    const g = globalThis as Globals;
    const original: Globals = {};

    let bitmap: { width: number; height: number; close: jest.Mock };
    let canvas: { width: number; height: number; getContext: jest.Mock };
    let context: { drawImage: jest.Mock; getImageData: jest.Mock };
    let createImageBitmapMock: jest.Mock;

    beforeEach(() => {
        original.createImageBitmap = g.createImageBitmap;
        original.OffscreenCanvas = g.OffscreenCanvas;

        bitmap = { width: 1200, height: 1200, close: jest.fn() };
        context = { drawImage: jest.fn(), getImageData: jest.fn(() => ({ width: 1200, height: 1200 })) };
        canvas = { width: 1200, height: 1200, getContext: jest.fn(() => context) };
        createImageBitmapMock = jest.fn(async () => bitmap);
        g.createImageBitmap = createImageBitmapMock;
        g.OffscreenCanvas = jest.fn(() => canvas);
    });

    afterEach(() => {
        g.createImageBitmap = original.createImageBitmap;
        g.OffscreenCanvas = original.OffscreenCanvas;
    });

    it('decodes with imageOrientation from-image and closes the bitmap before reading pixels', async () => {
        const order: string[] = [];
        bitmap.close.mockImplementation(() => order.push('close'));
        context.getImageData.mockImplementation(() => {
            order.push('getImageData');
            return { width: 1200, height: 1200 };
        });

        const input = file();
        const result = await decodePixels(input);

        expect(createImageBitmapMock).toHaveBeenCalledWith(input, { imageOrientation: 'from-image' });
        expect(result.ok).toBe(true);
        expect(order).toEqual(['close', 'getImageData']);
        expect(bitmap.close).toHaveBeenCalledTimes(1);
        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
    });

    it('rejects images above the pixel limit and closes the bitmap', async () => {
        bitmap.width = 8001;
        bitmap.height = Math.floor(MAX_INPUT_PIXELS / 8001) + 1;
        const result = await decodePixels(file());
        expect(!result.ok && result.error).toBe('image exceeds the maximum pixel count');
        expect(bitmap.close).toHaveBeenCalledTimes(1);
        expect(g.OffscreenCanvas).not.toHaveBeenCalled();
    });

    it('accepts exactly the pixel limit', async () => {
        bitmap.width = 8000;
        bitmap.height = 5000;
        const result = await decodePixels(file());
        expect(result.ok).toBe(true);
    });

    it('closes the bitmap and zeroes the canvas when getContext returns null', async () => {
        canvas.getContext.mockReturnValue(null);
        const result = await decodePixels(file());
        expect(!result.ok && result.error).toBe('2d context unavailable');
        expect(bitmap.close).toHaveBeenCalledTimes(1);
        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
    });

    it('closes the bitmap when the canvas constructor throws', async () => {
        g.OffscreenCanvas = jest.fn(() => {
            throw new Error('oom');
        });
        const result = await decodePixels(file());
        expect(!result.ok && result.error).toBe('oom');
        expect(bitmap.close).toHaveBeenCalledTimes(1);
    });

    it('closes the bitmap and zeroes the canvas when getImageData throws', async () => {
        context.getImageData.mockImplementation(() => {
            throw new Error('readback failed');
        });
        const result = await decodePixels(file());
        expect(!result.ok && result.error).toBe('readback failed');
        expect(bitmap.close).toHaveBeenCalledTimes(1);
        expect(canvas.width).toBe(0);
    });

    it('returns an error when createImageBitmap rejects', async () => {
        createImageBitmapMock.mockRejectedValue(new Error('bad image'));
        const result = await decodePixels(file());
        expect(!result.ok && result.error).toBe('bad image');
    });
});
