import { startUploadPipeline } from '../uploadPipeline';
import { useMediaStore } from '../mediaStore';
import { validateOne } from '../validateOne';
import { tusUpload } from '@/lib/tus-client';
import { compressImage } from '../compression/compressImage';
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

jest.mock('../compression/compressImage', () => ({
  compressImage: jest.fn(),
}));

function createTestFile(name = 'photo.jpg', size = 1024 * 1024, type = 'image/jpeg'): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

async function waitForCalls(count: number) {
  for (let i = 0; i < 50 && (compressImage as jest.Mock).mock.calls.length < count; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('uploadPipeline Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-preview');
    jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    useMediaStore.getState().reset();
    (validateOne as jest.Mock).mockResolvedValue(null);
    (compressImage as jest.Mock).mockImplementation(async (file: File) => file);
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

  describe('Client-side compression', () => {
    it('goes through optimizing before uploading and sends the compressed file to TUS', async () => {
      const original = createTestFile('big.jpg', 2048);
      const compressed = new File([new ArrayBuffer(10)], 'big.webp', { type: 'image/webp' });
      (compressImage as jest.Mock).mockResolvedValue(compressed);

      const seen: string[] = [];
      const unsubscribe = useMediaStore.subscribe((state) => {
        const status = state.mediaList[0]?.status;
        if (status && seen[seen.length - 1] !== status) seen.push(status);
      });
      (tusUpload as jest.Mock).mockImplementation(async ({ onProgress, onSuccess, id }) => {
        onProgress?.(50);
        onSuccess?.(`http://localhost:3000/uploads/srv-${id}`);
        return Result.ok('ok');
      });

      await startUploadPipeline([original], 'session-123');
      unsubscribe();

      expect(seen.indexOf('optimizing')).toBeGreaterThan(-1);
      expect(seen.indexOf('optimizing')).toBeLessThan(seen.indexOf('uploading'));
      expect(compressImage).toHaveBeenCalledWith(original);
      expect((tusUpload as jest.Mock).mock.calls[0][0].file).toBe(compressed);

      const item = useMediaStore.getState().mediaList[0];
      expect(item.file).toBe(original);
      expect(item.status).toBe('uploaded');
    });

    it('uploads the original when compression returns it unchanged', async () => {
      const original = createTestFile('small.jpg', 2048);
      await startUploadPipeline([original], 'session-123');
      expect((tusUpload as jest.Mock).mock.calls[0][0].file).toBe(original);
    });

    it('sets status to optimizing at the moment compressImage is called', async () => {
      let statusDuringCompress: string | undefined;
      (compressImage as jest.Mock).mockImplementation(async (file: File) => {
        statusDuringCompress = useMediaStore.getState().mediaList[0]?.status;
        return file;
      });

      await startUploadPipeline([createTestFile('a.jpg')], 'session-123');

      expect(statusDuringCompress).toBe('optimizing');
    });

    it('uploads the original and does not get stuck when compressImage rejects', async () => {
      const original = createTestFile('boom.jpg');
      (compressImage as jest.Mock).mockRejectedValue(new Error('worker exploded'));

      await startUploadPipeline([original], 'session-123');

      expect((tusUpload as jest.Mock).mock.calls[0][0].file).toBe(original);
      expect(useMediaStore.getState().mediaList[0].status).toBe('uploaded');
    });

    it('keeps previewUrl and file as the original after compression', async () => {
      const original = createTestFile('big.jpg');
      (compressImage as jest.Mock).mockResolvedValue(
        new File([new ArrayBuffer(10)], 'big.webp', { type: 'image/webp' }),
      );

      await startUploadPipeline([original], 'session-123');

      const item = useMediaStore.getState().mediaList[0];
      expect(item.file).toBe(original);
      expect(item.previewUrl).toBe('blob:http://localhost/test-preview');
    });

    it('uses the original filename (not .webp) in the failure toast', async () => {
      (compressImage as jest.Mock).mockResolvedValue(
        new File([new ArrayBuffer(10)], 'fail.webp', { type: 'image/webp' }),
      );
      (tusUpload as jest.Mock).mockImplementation(async ({ onError }: { onError?: (err: Error) => void }) => {
        const err = new Error('Connection reset by peer');
        onError?.(err);
        return Result.err(err);
      });

      await startUploadPipeline([createTestFile('fail.jpg')], 'session-123');

      expect(toast.error).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.failedToUpload('fail.jpg'),
        expect.anything(),
      );
    });

    it('runs at most 3 compressImage calls concurrently', async () => {
      const releases: Array<() => void> = [];
      let active = 0;
      let maxActive = 0;
      (compressImage as jest.Mock).mockImplementation(
        (file: File) =>
          new Promise<File>((resolve) => {
            active += 1;
            maxActive = Math.max(maxActive, active);
            releases.push(() => {
              active -= 1;
              resolve(file);
            });
          }),
      );

      const files = Array.from({ length: 5 }, (_, i) => createTestFile(`c-${i}.jpg`));
      const pipeline = startUploadPipeline(files, 'session-123');

      await waitForCalls(3);
      expect(compressImage).toHaveBeenCalledTimes(3);

      while (releases.length) {
        releases.shift()!();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      await pipeline;

      expect(maxActive).toBeLessThanOrEqual(3);
      expect(compressImage).toHaveBeenCalledTimes(5);
    });

    it('passes the compressed file to tusUpload for every item in a multi-file batch', async () => {
      const compressedByName = new Map<string, File>();
      (compressImage as jest.Mock).mockImplementation(async (file: File) => {
        const compressed = new File([new ArrayBuffer(4)], file.name.replace('.jpg', '.webp'), { type: 'image/webp' });
        compressedByName.set(file.name, compressed);
        return compressed;
      });

      const files = [createTestFile('one.jpg'), createTestFile('two.jpg'), createTestFile('three.jpg')];
      await startUploadPipeline(files, 'session-123');

      const uploaded = (tusUpload as jest.Mock).mock.calls.map((call) => call[0].file as File);
      expect(uploaded).toHaveLength(3);
      expect(new Set(uploaded)).toEqual(new Set(compressedByName.values()));
      expect(uploaded.every((f) => f.type === 'image/webp')).toBe(true);
    });
  });
});
