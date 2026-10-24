import { logger } from '@/lib/telemetry/logger';
import { Result } from '@/lib/utils/result';
import { compressInWorker, isCompressionSupported } from './compressionPool';

const uploadLogger = logger.forDomain('upload');

type CompressionOutcome = 'unsupported' | 'worker_error' | 'no_gain' | 'compressed';

function toWebpName(name: string): string {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    return `${base}.webp`;
}

// Deliberately logs sizes only: file names can contain personal data.
function logCompression(
    outcome: CompressionOutcome,
    inputBytes: number,
    outputBytes?: number,
    reason?: string,
): void {
    uploadLogger.info('image compression', {
        action: 'compress_image',
        outcome,
        inputBytes,
        outputBytes,
        reason,
    });
}

// Dev-only opt-in: save each compressed file so its quality can be checked by eye.
function isInspectionDownloadEnabled(): boolean {
    return (
        process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_DEBUG_COMPRESSION === 'true'
    );
}

function downloadForInspection(file: File): void {
    if (!isInspectionDownloadEnabled()) return;

    // A failure here must never fail the compression itself.
    Result.trySync(() => {
        const url = URL.createObjectURL(file);
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
    });
}

/**
 * Compresses an image on-device to WebP. Always resolves: any failure
 * (unsupported browser, error, timeout, no size gain) yields the original file.
 */
export async function compressImage(file: File): Promise<File> {
    if (!isCompressionSupported()) {
        logCompression('unsupported', file.size);
        return file;
    }

    const settled = await Result.try(() => compressInWorker(file));
    if (!settled.ok) {
        logCompression('worker_error', file.size, undefined, String(settled.error));
        return file;
    }

    const result = settled.value;
    if (!result.ok) {
        logCompression('worker_error', file.size, undefined, result.error);
        return file;
    }

    const buffer = result.value;
    if (buffer.byteLength >= file.size) {
        logCompression('no_gain', file.size, buffer.byteLength);
        return file;
    }

    logCompression('compressed', file.size, buffer.byteLength);
    // Keep lastModified so the TUS fingerprint is stable across retries.
    const compressed = new File([buffer], toWebpName(file.name), {
        type: 'image/webp',
        lastModified: file.lastModified,
    });
    downloadForInspection(compressed);
    return compressed;
}
