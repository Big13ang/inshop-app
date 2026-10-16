import * as tus from 'tus-js-client';
import { Result } from '@/lib/utils'; // Project's Result helper
import { env } from '@/env';
import { FetchHttpStack } from './fetchHttpStack';

export interface TusUploadOptions {
    file: File;
    id: string;
    onProgress?: (percentage: number) => void;
    onSuccess?: (url: string) => void;
    onError?: (error: Error) => void;
    endpoint?: string;
    uploadSessionId?: string;
}

/**
 * Uploads a file using TUS protocol wrapped in project's Result pattern.
 * 
 * @returns Promise<Result<string, Error>>
 */

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function stripTrailingSlashes(path: string): string {
    return path.replace(/\/+$/, '');
}

// Only resume uploads created against the same endpoint (same origin, and a path
// equal to or nested under the endpoint path). A stored upload URL from another
// API (e.g. an older dev setup) would send HEAD/PATCH straight there. Comparing
// path segments avoids treating `/uploads-old/...` as part of `/uploads`.
function isResumableForEndpoint(previous: tus.PreviousUpload, endpoint: string): boolean {
    const storedUrl = previous.uploadUrl;
    if (typeof storedUrl !== 'string') return false;

    const endpointUrl = Result.trySync(() => new URL(endpoint));
    const uploadUrl = Result.trySync(() => new URL(storedUrl));
    if (!endpointUrl.ok || !uploadUrl.ok) return false;
    if (endpointUrl.value.origin !== uploadUrl.value.origin) return false;

    const endpointPath = stripTrailingSlashes(endpointUrl.value.pathname);
    const uploadPath = uploadUrl.value.pathname;
    return uploadPath === endpointPath || uploadPath.startsWith(`${endpointPath}/`);
}

async function removeStaleUpload(upload: tus.Upload, previous: tus.PreviousUpload): Promise<void> {
    await Result.try(async () => upload.options.urlStorage?.removeUpload(previous.urlStorageKey));
}

async function startOrResumeUpload(upload: tus.Upload, endpoint: string): Promise<void> {
    const previousUploads = await upload.findPreviousUploads();
    const resumable = previousUploads.find((previous) => isResumableForEndpoint(previous, endpoint));
    const stale = previousUploads.filter((previous) => previous !== resumable);
    await Promise.all(stale.map((previous) => removeStaleUpload(upload, previous)));
    if (resumable) {
        upload.resumeFromPreviousUpload(resumable);
    }
    upload.start();
}

export function tusUpload({
    file,
    id,
    onProgress,
    onSuccess,
    onError,
    endpoint = `${env.NEXT_PUBLIC_API_URL}/uploads`,
    uploadSessionId = '',
}: TusUploadOptions): Promise<Result<string, Error>> {
    return new Promise((resolve) => {
        const upload = new tus.Upload(file, {
            endpoint,
            chunkSize: 2 * 1024 * 1024,
            retryDelays: [0, 1_000, 3_000, 5_000],
            removeFingerprintOnSuccess: true,
            httpStack: new FetchHttpStack(),
            metadata: {
                id,
                filename: file.name,
                filetype: file.type,
                ...(uploadSessionId ? { uploadSessionId } : {}),
            },
            onProgress: (bytesUploaded, bytesTotal) => {
                const progressPercentage = Math.round(
                    (bytesUploaded / bytesTotal) * 100
                );
                if (onProgress) onProgress(progressPercentage);
            },
            onError: (rawError) => {
                const err = normalizeError(rawError);
                if (onError) onError(err);
                resolve(Result.err(err));
            },
            onSuccess: () => {
                const url = upload.url ?? `${endpoint}/${id}`;
                if (onSuccess) onSuccess(url);
                resolve(Result.ok(url));
            },
        });

        const startUpload = async () => {
            const started = await Result.try(startOrResumeUpload(upload, endpoint));
            if (started.ok) return;
            const err = normalizeError(started.error);
            if (onError) onError(err);
            resolve(Result.err(err));
        };

        startUpload();
    });
}

