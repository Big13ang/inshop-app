import { Result } from '@/lib/utils/result';

// Mirrors inshop-back-end/src/upload-session/image-processing.service.ts so the
// backend's first compression attempt accepts what the client produces.
export const DIMENSIONS = [1920, 1440, 1200, 1080] as const;
export const MAX_INPUT_PIXELS = 40_000_000;
// Backend validateResolution requires both sides >= MIN_SIDE.
export const MIN_SIDE = 1080;
// The backend always re-encodes what it receives. Encoding here at a low quality
// means two lossy passes, which visibly softens the photo. q95 keeps the client
// pass close to lossless (measured within ~0.2 dB of the backend-only result),
// so the backend's single pass decides the final quality.
export const CLIENT_WEBP_QUALITY = 95;

export type TargetSize = { width: number; height: number };

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

export type PixelCodec<Image extends TargetSize> = {
    resize: (source: Image, width: number, height: number) => Promise<Image>;
    encode: (image: Image, quality: number) => Promise<ArrayBuffer>;
};

/**
 * Resizes to the largest backend-accepted size and encodes once at
 * CLIENT_WEBP_QUALITY. No size cap: the backend decides the final size.
 */
export async function compressPixels<Image extends TargetSize>(
    source: Image,
    codec: PixelCodec<Image>,
): Promise<Result<ArrayBuffer, string>> {
    const [target] = getCandidateTargets(source.width, source.height);
    if (!target) return Result.err('no target size');

    const resized =
        target.width === source.width && target.height === source.height
            ? source
            : await codec.resize(source, target.width, target.height);

    return Result.ok(await codec.encode(resized, CLIENT_WEBP_QUALITY));
}
