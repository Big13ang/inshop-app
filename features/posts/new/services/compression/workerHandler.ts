// Pure request handling for compress.worker.ts: no `self`, no jSquash imports, so
// it can be unit-tested with injected fakes.
import { Result } from '@/lib/utils/result';
import {
    MAX_INPUT_PIXELS,
    compressPixels,
    type PixelCodec,
    type TargetSize,
} from './compressionPolicy';
import type { CompressionRequest, CompressionResponse } from './types';

type Failure = string;

function toFailure(error: unknown): Failure {
    return error instanceof Error ? error.message : String(error);
}

// Release the canvas backing store now instead of waiting for GC.
function releaseCanvas(canvas: OffscreenCanvas) {
    canvas.width = 0;
    canvas.height = 0;
}

function drawBitmap(
    canvas: OffscreenCanvas,
    bitmap: ImageBitmap,
): Result<OffscreenCanvasRenderingContext2D, Failure> {
    const drawn = Result.trySync(() => {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('2d context unavailable');
        context.drawImage(bitmap, 0, 0);
        return context;
    });
    return drawn.ok ? drawn : Result.err(toFailure(drawn.error));
}

/** Decodes with native APIs (EXIF-oriented). The bitmap is closed on every path. */
export async function decodePixels(file: File): Promise<Result<ImageData, Failure>> {
    const bitmapResult = await Result.try(
        createImageBitmap(file, { imageOrientation: 'from-image' }),
    );
    if (!bitmapResult.ok) return Result.err(toFailure(bitmapResult.error));

    const bitmap = bitmapResult.value;
    const { width, height } = bitmap;
    if (width * height > MAX_INPUT_PIXELS) {
        bitmap.close();
        return Result.err('image exceeds the maximum pixel count');
    }

    const created = Result.trySync(() => new OffscreenCanvas(width, height));
    if (!created.ok) {
        bitmap.close();
        return Result.err(toFailure(created.error));
    }

    const canvas = created.value;
    const drawn = drawBitmap(canvas, bitmap);
    // The pixels now live in the canvas; free the decoded bitmap before the copy.
    bitmap.close();
    if (!drawn.ok) {
        releaseCanvas(canvas);
        return drawn;
    }

    const pixels = Result.trySync(() => drawn.value.getImageData(0, 0, width, height));
    releaseCanvas(canvas);
    return pixels.ok ? pixels : Result.err(toFailure(pixels.error));
}

export type RequestHandlerDeps<Image extends TargetSize> = {
    decode: (file: File) => Promise<Result<Image, Failure>>;
    codec: PixelCodec<Image>;
    initCodecs: () => Promise<unknown>;
    post: (response: CompressionResponse, transfer?: Transferable[]) => void;
};

export function createRequestHandler<Image extends TargetSize>(deps: RequestHandlerDeps<Image>) {
    // Codec init instantiates WASM; run it once however many warmups arrive.
    let ready: Promise<Result<unknown, Failure>> | null = null;

    async function initOnce(): Promise<Result<unknown, Failure>> {
        const initialized = await Result.try(deps.initCodecs());
        if (initialized.ok) return initialized;
        // Allow a later warmup to retry after a failed init.
        ready = null;
        return Result.err(toFailure(initialized.error));
    }

    async function warmup() {
        ready ??= initOnce();
        await ready;
    }

    async function compress(file: File): Promise<Result<ArrayBuffer, Failure>> {
        const decoded = await deps.decode(file);
        if (!decoded.ok) return decoded;

        const compressed = await Result.try(compressPixels(decoded.value, deps.codec));
        if (!compressed.ok) return Result.err(toFailure(compressed.error));
        return compressed.value;
    }

    async function handleCompress(id: number, file: File) {
        const result = await compress(file);
        if (result.ok) {
            deps.post({ type: 'compressed', id, ok: true, buffer: result.value }, [result.value]);
            return;
        }
        deps.post({ type: 'compressed', id, ok: false, error: result.error });
    }

    return async function handleRequest(request: CompressionRequest): Promise<void> {
        if (request.type === 'warmup') {
            await warmup();
            return;
        }
        await handleCompress(request.id, request.file);
    };
}
