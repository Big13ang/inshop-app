import pLimit from "p-limit";
import { toast } from "sonner";
import { MediaItem } from "../types";
import { getMediaKind } from "@/lib/utils/media";
import { useMediaStore } from "./mediaStore";
import { validateOne } from "./validateOne";
import { tusUpload } from "@/lib/tus-client";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { Result } from "@/lib/utils";

import { MAX_IMAGES } from "../constants";

const limit = pLimit(3);

const buildMediaItem = (file: File): MediaItem => {
    return {
        id: crypto.randomUUID(),
        kind: getMediaKind(file),
        status: 'pending',
        uploadProgress: 0,
        order: null,
        previewUrl: null,
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
                previewUrl: URL.createObjectURL(item.file),
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
    onSuccess,
    onProgress,
    uploadSessionId,
}: UploadMediaWithTusArguments) => {
    return await tusUpload({
        uploadSessionId,
        id: mediaItem.id,
        file: mediaItem.file,
        onError,
        onSuccess,
        onProgress,
    })
}

const handleMeidaUploadError = (media: MediaItem, error: Error) => {
    useMediaStore.getState().patchItem(media.id, {
        status: 'failed',
    });

    let description = error.message;
    if (error.message.includes('resolution') || error.message.includes('1080')) {
        description = ERROR_MESSAGES.upload.resolutionTooSmall;
    } else {
        const cleanMsg = error.message.replace(/^tus:\s*/i, '');
        if (cleanMsg && cleanMsg.length < 150) {
            description = cleanMsg;
        }
    }

    toast.error(ERROR_MESSAGES.upload.failedToUpload(media.file.name), {
        description,
    });
};

const handleMeidaUploadSuccess = (media: MediaItem, url: string) => {
    useMediaStore.getState().patchItem(media.id, {
        previewUrl: url,
        status: 'uploaded',
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
            onError: (error) => handleMeidaUploadError(media, error),
            onSuccess: (url) => handleMeidaUploadSuccess(media, url),
            onProgress: (percentage) => handleMediaUploadProgress(media, percentage),
        })
    );

    Result.match(result, {
        ok: () => { },
        err: (error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            handleMeidaUploadError(media, err);
        },
    });
};

export const startUploadPipeline = async (files: File[], uploadSessionId: string) => {
    const newItems = addMediaItem(files);
    if (!newItems.length) return;

    const validNewItems = await validateMediaItems(newItems);
    if (!validNewItems.length) return;

    await handleLimitConcurrentUploads(validNewItems, uploadSessionId);
};

