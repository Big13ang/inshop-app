import { startUploadPipeline } from '../uploadPipeline';
import { useMediaStore } from '../mediaStore';
import { validateOne } from '../validateOne';
import { tusUpload } from '@/lib/tus-client';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { Result } from '@/lib/utils';
import type { MediaItem } from '../../types';

jest.mock('../validateOne', () => ({
  validateOne: jest.fn(),
}));

jest.mock('@/lib/tus-client', () => ({
  tusUpload: jest.fn(),
}));

function createTestFile(name = 'photo.jpg', size = 1024 * 1024, type = 'image/jpeg'): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

describe('uploadPipeline Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-preview');
    jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    useMediaStore.getState().reset();
    (validateOne as jest.Mock).mockResolvedValue(null);
    (tusUpload as jest.Mock).mockImplementation(async ({ onSuccess, id }: { onSuccess?: (url: string) => void; id: string }) => {
      onSuccess?.(`http://localhost:3000/uploads/srv-${id}`);
      return Result.ok(`http://localhost:3000/uploads/srv-${id}`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Batch Quotas & Quota Slicing (QUO-01 to QUO-05)', () => {
    it('QUO-01: adds and queues files when within quota (3 files)', async () => {
      const files = [
        createTestFile('a.jpg'),
        createTestFile('b.jpg'),
        createTestFile('c.jpg'),
      ];

      await startUploadPipeline(files, 'session-123');

      const items = useMediaStore.getState().mediaList;
      expect(items).toHaveLength(3);
      expect(items.every((i) => i.status === 'uploaded')).toBe(true);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3]);
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('QUO-02: allows upload reaching exact max limit (10 files)', async () => {
      const files = Array.from({ length: 10 }, (_, i) => createTestFile(`img-${i}.jpg`));

      await startUploadPipeline(files, 'session-123');

      const items = useMediaStore.getState().mediaList;
      expect(items).toHaveLength(10);
      expect(items.every((i) => i.status === 'uploaded')).toBe(true);
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('QUO-03: slices excess files from empty store and warns user with toast info', async () => {
      const files = Array.from({ length: 12 }, (_, i) => createTestFile(`img-${i}.jpg`));

      await startUploadPipeline(files, 'session-123');

      const items = useMediaStore.getState().mediaList;
      expect(items).toHaveLength(10);
      expect(toast.info).toHaveBeenCalledWith(ERROR_MESSAGES.upload.maxImagesReached(10));
    });

    it('QUO-04: slices incremental batch when remaining slots is less than batch size', async () => {
      const existingItems: MediaItem[] = Array.from({ length: 8 }, (_, i) => ({
        id: `existing-${i}`,
        serverMediaId: `srv-${i}`,
        kind: 'image',
        status: 'uploaded',
        uploadProgress: 100,
        order: i + 1,
        previewUrl: 'blob:test',
        isValid: true,
        file: createTestFile(`old-${i}.jpg`),
      }));
      useMediaStore.getState().setMediaList(existingItems);

      const newFiles = [
        createTestFile('new-1.jpg'),
        createTestFile('new-2.jpg'),
        createTestFile('new-3.jpg'),
        createTestFile('new-4.jpg'),
      ];

      await startUploadPipeline(newFiles, 'session-123');

      const items = useMediaStore.getState().mediaList;
      expect(items).toHaveLength(10);
      expect(toast.info).toHaveBeenCalledWith(ERROR_MESSAGES.upload.maxImagesReached(2));
      expect(items[8].file.name).toBe('new-1.jpg');
      expect(items[9].file.name).toBe('new-2.jpg');
    });

    it('QUO-05: blocks upload attempt and toasts error when store is already at capacity (10 images)', async () => {
      const existingItems: MediaItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `existing-${i}`,
        serverMediaId: `srv-${i}`,
        kind: 'image',
        status: 'uploaded',
        uploadProgress: 100,
        order: i + 1,
        previewUrl: 'blob:test',
        isValid: true,
        file: createTestFile(`old-${i}.jpg`),
      }));
      useMediaStore.getState().setMediaList(existingItems);

      const newFiles = [createTestFile('overflow.jpg')];
      await startUploadPipeline(newFiles, 'session-123');

      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.upload.maxImagesLimit(10));
      expect(useMediaStore.getState().mediaList).toHaveLength(10);
      expect(tusUpload).not.toHaveBeenCalled();
    });
  });

  describe('Validation & Mixed Batches (QUO-06)', () => {
    it('QUO-06: discards rejected items with error toast while processing valid items', async () => {
      const fileValid1 = createTestFile('valid-1.jpg');
      const fileInvalid = createTestFile('small.jpg');
      const fileValid2 = createTestFile('valid-2.jpg');

      (validateOne as jest.Mock).mockImplementation(async (f: File) => {
        if (f.name === 'small.jpg') {
          return {
            code: 'RESOLUTION_TOO_LOW',
            reason: 'کیفیت تصویر پایین است',
          };
        }
        return null;
      });

      await startUploadPipeline([fileValid1, fileInvalid, fileValid2], 'session-123');

      const items = useMediaStore.getState().mediaList;
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.file.name)).toEqual(['valid-1.jpg', 'valid-2.jpg']);
      expect(items.map((i) => i.order)).toEqual([1, 2]);

      expect(toast.error).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.imageUnacceptable('small.jpg'),
        { description: 'کیفیت تصویر پایین است' }
      );
    });
  });

  describe('Concurrency Throttle (UPL-04)', () => {
    it('UPL-04: limits concurrent active tus uploads to at most 3', async () => {
      let activeConcurrentCount = 0;
      let maxObservedConcurrentCount = 0;

      (tusUpload as jest.Mock).mockImplementation(
        async ({ id, onSuccess }: { id: string; onSuccess?: (url: string) => void }) => {
          activeConcurrentCount += 1;
          maxObservedConcurrentCount = Math.max(maxObservedConcurrentCount, activeConcurrentCount);

          // Simulate asynchronous network delay
          await new Promise((resolve) => setTimeout(resolve, 20));

          activeConcurrentCount -= 1;
          onSuccess?.(`http://localhost:3000/uploads/srv-${id}`);
          return Result.ok(`http://localhost:3000/uploads/srv-${id}`);
        }
      );

      const files = Array.from({ length: 6 }, (_, i) => createTestFile(`concur-${i}.jpg`));
      await startUploadPipeline(files, 'session-123');

      expect(maxObservedConcurrentCount).toBeLessThanOrEqual(3);
      expect(useMediaStore.getState().mediaList.every((i) => i.status === 'uploaded')).toBe(true);
    });
  });

  describe('Upload State Transitions, Progress, Success & Failure (UPL-03, UPL-05 to UPL-08)', () => {
    it('UPL-03 & UPL-05: updates progress percentage and status to uploading via onProgress callback', async () => {
      let capturedOnProgress: ((pct: number) => void) | undefined;

      (tusUpload as jest.Mock).mockImplementation(
        async ({ onProgress, onSuccess, id }: {
          onProgress?: (pct: number) => void;
          onSuccess?: (url: string) => void;
          id: string;
        }) => {
          capturedOnProgress = onProgress;
          onProgress?.(55);

          const intermediateItem = useMediaStore.getState().mediaList[0];
          expect(intermediateItem.status).toBe('uploading');
          expect(intermediateItem.uploadProgress).toBe(55);

          onSuccess?.(`http://localhost:3000/uploads/srv-${id}`);
          return Result.ok(`http://localhost:3000/uploads/srv-${id}`);
        }
      );

      const file = createTestFile('test.jpg');
      await startUploadPipeline([file], 'session-123');

      expect(capturedOnProgress).toBeDefined();
      const finalItem = useMediaStore.getState().mediaList[0];
      expect(finalItem.status).toBe('uploaded');
      expect(finalItem.serverMediaId).toBe(`srv-${finalItem.id}`);
    });

    it('UPL-07: marks item as failed and toasts error on standard network failure', async () => {
      (tusUpload as jest.Mock).mockImplementation(
        async ({ onError }: { onError?: (err: Error) => void }) => {
          const err = new Error('Connection reset by peer');
          onError?.(err);
          return Result.err(err);
        }
      );

      const file = createTestFile('fail.jpg');
      await startUploadPipeline([file], 'session-123');

      const item = useMediaStore.getState().mediaList[0];
      expect(item.status).toBe('failed');
      expect(toast.error).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.failedToUpload('fail.jpg'),
        { description: 'Connection reset by peer' }
      );
    });

    it('UPL-08: displays specialized resolution error when backend returns resolution failure', async () => {
      (tusUpload as jest.Mock).mockImplementation(
        async ({ onError }: { onError?: (err: Error) => void }) => {
          const err = new Error('tus: image resolution too small, must be 1080');
          onError?.(err);
          return Result.err(err);
        }
      );

      const file = createTestFile('lowres.jpg');
      await startUploadPipeline([file], 'session-123');

      const item = useMediaStore.getState().mediaList[0];
      expect(item.status).toBe('failed');
      expect(toast.error).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.failedToUpload('lowres.jpg'),
        { description: ERROR_MESSAGES.upload.resolutionTooSmall }
      );
    });
  });
});
