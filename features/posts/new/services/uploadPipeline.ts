import pLimit from "p-limit";
import { toast } from "sonner";
import { MediaItem } from "../types";
import { getMediaKind } from "@/lib/utils/media";
import { useMediaStore } from "./mediaStore";
import { validateOne, IMAGE_MAX_BYTES } from "./validateOne";
import { tusUpload } from "@/lib/tus-client";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { Result, extractMediaId } from "@/lib/utils";

import { MAX_IMAGES } from "../constants";
import { compressImage } from "./compression/compressImage";

const limit = pLimit(3);

export const buildMediaItem = (file: File): MediaItem => {
    return {
        id: crypto.randomUUID(),
        serverMediaId: null,
        kind: getMediaKind(file),
        status: 'pending',
        uploadProgress: 0,
        order: null,
        previewUrl: URL.createObjectURL(file),
        isValid: false,
        file,
    }
}

const addMediaItem = (files: File[]): MediaItem[] => {
    if (!files.length) return [];

    const store = useMediaStore.getState();
    const mediaItems = store.mediaList || [];
    const availableSlots = MAX_IMAGES - mediaItems.length;

    if (availableSlots <= 0) {
        toast.error(ERROR_MESSAGES.upload.maxImagesLimit(MAX_IMAGES));
        return [];
    }

    const allowedFiles = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
        toast.info(ERROR_MESSAGES.upload.maxImagesReached(availableSlots));
    }

    const newMediaItems = allowedFiles.map(
        (file) => buildMediaItem(file)
    )

    store.setMediaList([...mediaItems, ...newMediaItems]);

    return newMediaItems;
}

// Android can lose access to a picked file later (NotReadableError), typically while it
// waits its turn to upload. Read the whole file into memory while access is still valid.
// Reads fail intermittently on Android (cloud-backed or just-picked photos), so a failed
// read is retried before the file is declared unreadable.
const READ_ATTEMPTS = 3;
const READ_RETRY_DELAY_MS = 200;

const waitBeforeRetry = () => new Promise<void>((resolve) => setTimeout(resolve, READ_RETRY_DELAY_MS));

const readBytes = async (file: File): Promise<Result<ArrayBuffer>> => {
    let bytes = await Result.try(file.arrayBuffer());
    for (let attempt = 1; attempt < READ_ATTEMPTS && !bytes.ok; attempt++) {
        await waitBeforeRetry();
        bytes = await Result.try(file.arrayBuffer());
    }
    return bytes;
};

const copyIntoMemory = async (file: File): Promise<Result<File>> => {
    // Too large to be accepted: validation rejects it by size without reading it.
    if (file.size > IMAGE_MAX_BYTES) return Result.ok(file);

    const bytes = await readBytes(file);
    if (!bytes.ok) {
        console.warn('[upload] could not read picked file', file.name, file.size, bytes.error);
        return Result.err(bytes.error);
    }
    return Result.ok(new File([bytes.value], file.name, {
        type: file.type,
        lastModified: file.lastModified,
    }));
};

const rejectMediaItem = (item: MediaItem, reason: string) => {
    useMediaStore.getState().removeItem(item.id);
    toast.error(ERROR_MESSAGES.upload.imageUnacceptable(item.file.name), {
        description: reason,
    });
};

const validateMediaItems = async (mediaItems: MediaItem[]) => {
    const store = useMediaStore.getState();
    const mediaList = store.mediaList || [];

    const maxOrder = mediaList.reduce(
        (max, item) => Math.max(max, item.order ?? 0), 0
    );

    let validCount = maxOrder;
    const validItems: MediaItem[] = [];


    store.setIsValidating(true);

    // Start reading every picked file right now, all at once: a file that waits its turn
    // behind the others is the one Android stops letting us read.
    const copies = mediaItems.map((item) => copyIntoMemory(item.file));

    for (let index = 0; index < mediaItems.length; index++) {
        const item = mediaItems[index];
        const copy = await copies[index];

        if (!copy.ok) {
            rejectMediaItem(item, ERROR_MESSAGES.upload.fileUnreadable);
            continue;
        }

        // Validate the in-memory copy, so the picked file is only ever read once.
        const rejection = await validateOne(copy.value);

        if (rejection) {
            rejectMediaItem(item, rejection.reason);
        } else {
            validCount += 1;

            const updateValidItem = {
                ...item,
                file: copy.value,
                isValid: true,
                order: validCount,
                status: 'queued' as const,
            } as MediaItem;

            store.patchItem(item.id, updateValidItem);

            validItems.push(updateValidItem);
        }
    }

    store.setIsValidating(false);

    return validItems;
}

const handleLimitConcurrentUploads = async (
    mediaList: MediaItem[],
    uploadSessionId: string
) => {
    const uploadPromises = mediaList.map((item) =>
        limit(() => uploadNextMedia(item, uploadSessionId))
    );

    await Promise.all(uploadPromises);
}

const handleMediaUploadSuccess = (media: MediaItem, url?: string) => {
    const serverMediaId = extractMediaId(url);
    useMediaStore.getState().patchItem(media.id, {
        status: 'uploaded',
        serverMediaId: serverMediaId ?? null,
    });
};

const handleMediaUploadError = (media: MediaItem, error: unknown) => {
    useMediaStore.getState().patchItem(media.id, {
        status: 'failed',
    });

    const errObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Upload failed');
    let description = errObj.message;
    if (errObj.message.includes('resolution') || errObj.message.includes('800')) {
        description = ERROR_MESSAGES.upload.resolutionTooSmall;
    } else {
        const cleanMsg = errObj.message.replace(/^tus:\s*/i, '');
        if (cleanMsg && cleanMsg.length < 150) {
            description = cleanMsg;
        }
    }

    toast.error(ERROR_MESSAGES.upload.failedToUpload(media.file.name), {
        description,
    });
};


const handleMediaUploadProgress = (media: MediaItem, percentage: number) => {
    useMediaStore.getState().patchItem(media.id, {
        uploadProgress: percentage,
        status: 'uploading',
    });
};

// Returns the file to upload. media.file and previewUrl stay the original;
// only the uploaded bytes change. A failure falls back to the original so the
// item can never be stranded at 'optimizing'.
const resolveFileToUpload = async (media: MediaItem): Promise<File> => {
    useMediaStore.getState().patchItem(media.id, { status: 'optimizing' });
    const compressed = await Result.try(compressImage(media.file));
    return compressed.ok ? compressed.value : media.file;
};

const uploadNextMedia = async (media: MediaItem, uploadSessionId: string) => {
    const fileToUpload = await resolveFileToUpload(media);

    const result = await Result.try(
        tusUpload({
            id: media.id,
            file: fileToUpload,
            uploadSessionId,
            onError: (error) => handleMediaUploadError(media, error),
            onProgress: (percentage) => handleMediaUploadProgress(media, percentage),
            onSuccess: (url) => handleMediaUploadSuccess(media, url),
        })
    );

    if (!result.ok) {
        handleMediaUploadError(media, result.error);
    }
};

export const startUploadPipeline = async (files: File[], uploadSessionId: string) => {
    const newItems = addMediaItem(files);
    if (!newItems.length) return;

    const validNewItems = await validateMediaItems(newItems);
    if (!validNewItems.length) return;

    await handleLimitConcurrentUploads(validNewItems, uploadSessionId);
};

