import pLimit from "p-limit";
import { toast } from "sonner";
import { MediaItem } from "../types";
import { getMediaKind } from "@/lib/utils/media";
import { useMediaStore } from "./mediaStore";
import { validateOne } from "./validateOne";
import { tusUpload } from "@/lib/tus-client";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { Result, extractMediaId } from "@/lib/utils";

import { MAX_IMAGES } from "../constants";

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

const validateMediaItems = async (mediaItems: MediaItem[]) => {
    const store = useMediaStore.getState();
    const mediaList = store.mediaList || [];

    const maxOrder = mediaList.reduce(
        (max, item) => Math.max(max, item.order ?? 0), 0
    );

    let validCount = maxOrder;
    const validItems: MediaItem[] = [];


    store.setIsValidating(true);

    for (let index = 0; index < mediaItems.length; index++) {
        const item = mediaItems[index];
        const rejection = await validateOne(item.file);

        if (rejection) {
            store.removeItem(item.id);



            toast.error(ERROR_MESSAGES.upload.imageUnacceptable(item.file.name), {
                description: rejection.reason,
            });
        } else {
            validCount += 1;

            const updateValidItem = {
                ...item,
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

type UploadMediaWithTusArguments = {
    mediaItem: MediaItem;
    uploadSessionId: string;
    onProgress: (percentage: number) => void;
    onError: (error: Error) => void;
    onSuccess: (url: string) => void;
}

const uploadMediaWithTus = async ({
    onError,
    mediaItem,
    onProgress,
    onSuccess,
    uploadSessionId,
}: UploadMediaWithTusArguments) => {
    return await tusUpload({
        uploadSessionId,
        id: mediaItem.id,
        file: mediaItem.file,
        onError,
        onProgress,
        onSuccess,
    })
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
    if (errObj.message.includes('resolution') || errObj.message.includes('1080')) {
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

const uploadNextMedia = async (media: MediaItem, uploadSessionId: string) => {
    const result = await Result.try(
        uploadMediaWithTus({
            mediaItem: media,
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

