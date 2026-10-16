import { Result } from '@/lib/utils/result';

// Mirrors inshop-back-end/src/upload-session/image-processing.service.ts so the
// backend's first compression attempt accepts what the client produces.
export const DIMENSIONS = [1920, 1440, 1200, 1080] as const;
export const QUALITIES = [80, 65, 50, 35, 20] as const;
export const MAX_TARGET_SIZE_BYTES = 100 * 1024;
export const MAX_INPUT_PIXELS = 40_000_000;
// Backend validateResolution requires both sides >= MIN_SIDE.
export const MIN_SIDE = 1080;

export type TargetSize = { width: number; height: number };

export type EncodedImage = { buffer: ArrayBuffer; quality: number };

export type QualitySearchResult = {
    /** Highest-quality encode that fits the target, or null. */
    fit: EncodedImage | null;
    /** Smallest encode seen during the search (for fallback). */
    smallest: EncodedImage | null;
};

export function getTargetSize(width: number, height: number, dimension: number): TargetSize {
    const longSide = Math.max(width, height);
    let scale = Math.min(1, dimension / longSide);

    const shortSide = Math.min(width, height);
    if (shortSide * scale < MIN_SIDE) {
        scale = Math.min(1, MIN_SIDE / shortSide);
    }

    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

/**
 * Distinct target sizes to try, largest first. The short-side clamp makes many
 * ladder rungs collapse to the same width x height, so dedupe on the size itself.
 */
export function getCandidateTargets(width: number, height: number): TargetSize[] {
    const maxSide = Math.max(width, height);
    const seen = new Set<string>();
    const targets: TargetSize[] = [];

    for (const rung of DIMENSIONS) {
        const target = getTargetSize(width, height, Math.min(maxSide, rung));
        const key = `${target.width}x${target.height}`;
        if (seen.has(key)) continue;
        seen.add(key);
        targets.push(target);
    }
    return targets;
}

/**
 * Binary search over the discrete QUALITIES (descending) for the highest
 * quality whose output is <= maxBytes. Size is monotonic in quality, so this
 * picks the same quality as a linear scan with at most 3 encodes.
 */
export async function searchBestQuality(
    encode: (quality: number) => Promise<ArrayBuffer>,
    maxBytes: number = MAX_TARGET_SIZE_BYTES,
): Promise<QualitySearchResult> {
    let low = 0;
    let high = QUALITIES.length - 1;
    let fit: EncodedImage | null = null;
    let smallest: EncodedImage | null = null;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const quality = QUALITIES[mid];
        const buffer = await encode(quality);

        if (!smallest || buffer.byteLength < smallest.buffer.byteLength) {
            smallest = { buffer, quality };
        }

        if (buffer.byteLength <= maxBytes) {
            fit = { buffer, quality };
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    return { fit, smallest };
}

export type PixelCodec<Image extends TargetSize> = {
    resize: (source: Image, width: number, height: number) => Promise<Image>;
    encode: (image: Image, quality: number) => Promise<ArrayBuffer>;
};

/**
 * Walks the size ladder from largest to smallest and returns the first encode
 * that fits maxBytes; if none fits, the smallest encode seen. Whether that is
 * smaller than the original file is the caller's decision.
 */
export async function compressPixels<Image extends TargetSize>(
    source: Image,
    codec: PixelCodec<Image>,
    maxBytes: number = MAX_TARGET_SIZE_BYTES,
): Promise<Result<ArrayBuffer, string>> {
    let smallest: ArrayBuffer | null = null;

    for (const target of getCandidateTargets(source.width, source.height)) {
        const resized =
            target.width === source.width && target.height === source.height
                ? source
                : await codec.resize(source, target.width, target.height);

        const search = await searchBestQuality((quality) => codec.encode(resized, quality), maxBytes);
        if (search.fit) return Result.ok(search.fit.buffer);

        const candidate = search.smallest?.buffer;
        if (candidate && (!smallest || candidate.byteLength < smallest.byteLength)) {
            smallest = candidate;
        }
    }

    return smallest ? Result.ok(smallest) : Result.err('no encode produced');
}
