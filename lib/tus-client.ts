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

async function startOrResumeUpload(upload: tus.Upload): Promise<void> {
    const previousUploads = await upload.findPreviousUploads();
    if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
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
            chunkSize: 5 * 1024 * 1024,
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

        startOrResumeUpload(upload).catch((rawError) => {
            const err = normalizeError(rawError);
            if (onError) onError(err);
            resolve(Result.err(err));
        });
    });
}

