import { createUploadService } from '../services/uploadService';
import { useMediaStore } from '../services/mediaStore';
import type { MediaItem } from '../types';
import type { UploadStrategy } from '../services/chunkStrategy';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function item(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 'default-id',
    name: 'f.jpg',
    file: new File(['x'], 'f.jpg', { type: 'image/jpeg' }),
    localUrl: 'blob:test-url',
    status: 'queued',
    progress: 0,
    mediaKind: 'image',
    ...overrides,
  };
}

function fakeStrategy(upload: UploadStrategy['upload']): UploadStrategy {
  return { upload };
}

beforeEach(() => {
  useMediaStore.setState({ itemMap: new Map(), selectedIds: [], activePreviewIdx: 0 });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createUploadService', () => {
  it('marks an item uploaded when the strategy resolves', async () => {
    const upload = jest.fn().mockResolvedValue('https://cdn/f.jpg');
    const service = createUploadService(fakeStrategy(upload));

    const a = item({ id: 'a' });
    useMediaStore.getState().addItems([a]);
    service.enqueue([a]);

    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('uploaded');
    expect(useMediaStore.getState().itemMap.get('a')?.uploadedUrl).toBe('https://cdn/f.jpg');
  });

  it('marks an item failed when the strategy rejects', async () => {
    const upload = jest.fn().mockRejectedValue(new Error('network error'));
    const service = createUploadService(fakeStrategy(upload));

    const a = item({ id: 'a' });
    useMediaStore.getState().addItems([a]);
    service.enqueue([a]);

    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('failed');
  });

  it('limits concurrent uploads to the configured concurrency', async () => {
    const resolveFns: Array<(url: string) => void> = [];
    const upload = jest.fn().mockImplementation(
      () => new Promise<string>((resolve) => { resolveFns.push(resolve); }),
    );
    const service = createUploadService(fakeStrategy(upload), 2);

    const items = [item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c' })];
    useMediaStore.getState().addItems(items);
    service.enqueue(items);

    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('uploading');
    expect(useMediaStore.getState().itemMap.get('b')?.status).toBe('uploading');
    expect(useMediaStore.getState().itemMap.get('c')?.status).toBe('queued');

    resolveFns.forEach((fn) => fn('https://cdn/f.jpg'));
    await new Promise(process.nextTick);
  });

  it('cancel aborts an in-flight upload and marks it cancelled', async () => {
    const upload = jest.fn().mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const service = createUploadService(fakeStrategy(upload));

    const a = item({ id: 'a' });
    useMediaStore.getState().addItems([a]);
    service.enqueue([a]);

    await new Promise(process.nextTick);

    service.cancel('a');
    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('cancelled');
  });

  it('does not resurrect a cancelled item when the upload resolves right after cancel', async () => {
    let resolveUpload!: (url: string) => void;
    const upload = jest.fn().mockImplementation(
      () => new Promise<string>((resolve) => { resolveUpload = resolve; }),
    );
    const service = createUploadService(fakeStrategy(upload));

    const a = item({ id: 'a' });
    useMediaStore.getState().addItems([a]);
    service.enqueue([a]);

    await new Promise(process.nextTick);

    // Race: the request already succeeded server-side and is about to resolve,
    // but cancel() runs first.
    service.cancel('a');
    resolveUpload('https://cdn/f.jpg');
    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('cancelled');
    expect(useMediaStore.getState().itemMap.get('a')?.uploadedUrl).toBeUndefined();
  });

  it('retry requeues a failed item and marks it uploaded on the next attempt', async () => {
    const upload = jest.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('https://cdn/retried.jpg');
    const service = createUploadService(fakeStrategy(upload));

    const a = item({ id: 'a' });
    useMediaStore.getState().addItems([a]);
    service.enqueue([a]);

    await new Promise(process.nextTick);
    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('failed');

    service.retry('a');
    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('uploaded');
    expect(useMediaStore.getState().itemMap.get('a')?.uploadedUrl).toBe('https://cdn/retried.jpg');
  });

  it('cancelAll aborts every in-flight upload', async () => {
    const upload = jest.fn().mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const service = createUploadService(fakeStrategy(upload));

    const items = [item({ id: 'a' }), item({ id: 'b' })];
    useMediaStore.getState().addItems(items);
    service.enqueue(items);

    await new Promise(process.nextTick);

    service.cancelAll();
    await new Promise(process.nextTick);

    expect(useMediaStore.getState().itemMap.get('a')?.status).toBe('cancelled');
    expect(useMediaStore.getState().itemMap.get('b')?.status).toBe('cancelled');
  });

  describe('error user feedback mapping', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('uses generic error message when error is not an Error instance', async () => {
      const upload = jest.fn().mockRejectedValue('some non-error rejection');
      const service = createUploadService(fakeStrategy(upload));
      const a = item({ id: 'a' });
      useMediaStore.getState().addItems([a]);
      service.enqueue([a]);
      await new Promise(process.nextTick);

      const toast = jest.requireMock<{ toast: { error: jest.Mock } }>('sonner').toast;
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.upload.failed);
    });

     it('uses resolution error message when error mentions resolution', async () => {
      const upload = jest.fn().mockRejectedValue(new Error('image resolution is too low'));
      const service = createUploadService(fakeStrategy(upload));
      const a = item({ id: 'a' });
      useMediaStore.getState().addItems([a]);
      service.enqueue([a]);
      await new Promise(process.nextTick);

      const toast = jest.requireMock<{ toast: { error: jest.Mock } }>('sonner').toast;
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.upload.resolutionTooSmall);
    });

    it('uses resolution error message when error mentions 1080', async () => {
      const upload = jest.fn().mockRejectedValue(new Error('needs to be 1080x1080 px'));
      const service = createUploadService(fakeStrategy(upload));
      const a = item({ id: 'a' });
      useMediaStore.getState().addItems([a]);
      service.enqueue([a]);
      await new Promise(process.nextTick);

      const toast = jest.requireMock<{ toast: { error: jest.Mock } }>('sonner').toast;
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.upload.resolutionTooSmall);
    });

    it('strips "tus:" prefix from error messages', async () => {
      const upload = jest.fn().mockRejectedValue(new Error('tus: Server is temporarily unavailable'));
      const service = createUploadService(fakeStrategy(upload));
      const a = item({ id: 'a' });
      useMediaStore.getState().addItems([a]);
      service.enqueue([a]);
      await new Promise(process.nextTick);

      const toast = jest.requireMock<{ toast: { error: jest.Mock } }>('sonner').toast;
      expect(toast.error).toHaveBeenCalledWith('Server is temporarily unavailable');
    });

    it('falls back to generic error message if the cleaned message is too long (>= 150 chars)', async () => {
      const longMessage = 'a'.repeat(150);
      const upload = jest.fn().mockRejectedValue(new Error(`tus: ${longMessage}`));
      const service = createUploadService(fakeStrategy(upload));
      const a = item({ id: 'a' });
      useMediaStore.getState().addItems([a]);
      service.enqueue([a]);
      await new Promise(process.nextTick);

      const toast = jest.requireMock<{ toast: { error: jest.Mock } }>('sonner').toast;
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.upload.failed);
    });

    it('uses the cleaned message if it is less than 150 chars', async () => {
      const mediumMessage = 'a'.repeat(149);
      const upload = jest.fn().mockRejectedValue(new Error(`tus: ${mediumMessage}`));
      const service = createUploadService(fakeStrategy(upload));
      const a = item({ id: 'a' });
      useMediaStore.getState().addItems([a]);
      service.enqueue([a]);
      await new Promise(process.nextTick);

      const toast = jest.requireMock<{ toast: { error: jest.Mock } }>('sonner').toast;
      expect(toast.error).toHaveBeenCalledWith(mediumMessage);
    });
  });
});
