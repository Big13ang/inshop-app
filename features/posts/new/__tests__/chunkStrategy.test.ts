import { createChunkStrategy } from '../services/chunkStrategy';
import { env } from '@/env';

// ── tus-js-client mock ───────────────────────────────────────────────────────
//
// We don't want to exercise the real tus protocol over the network here —
// only that createChunkStrategy wires options/callbacks into tus.Upload
// correctly. Each test grabs the latest constructed instance's options off
// `instances` to simulate server callbacks.

type UploadOptions = {
  endpoint: string;
  metadata: Record<string, string>;
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
  onError: (err: Error) => void;
  onSuccess: () => void;
};

jest.mock('tus-js-client', () => {
  class MockUpload {
    static instances: MockUpload[] = [];
    static mockFindPreviousUploads: () => Promise<unknown[]> = () => Promise.resolve([]);
    url: string | null = 'https://cdn/tus/abc';
    options: UploadOptions;
    aborted = false;

    constructor(_file: File, options: UploadOptions) {
      this.options = options;
      MockUpload.instances.push(this);
    }

    findPreviousUploads() {
      return MockUpload.mockFindPreviousUploads();
    }

    resumeFromPreviousUpload() { }

    start() { }

    abort() {
      this.aborted = true;
      return Promise.resolve();
    }
  }

  return { Upload: MockUpload };
});

const MockUpload = jest.requireMock<{ Upload: {
  instances: { options: UploadOptions; aborted: boolean }[];
  mockFindPreviousUploads: () => Promise<unknown[]>;
} }>('tus-js-client').Upload;

beforeEach(() => {
  MockUpload.instances = [];
  MockUpload.mockFindPreviousUploads = () => Promise.resolve([]);
});

const fileOf = (size: number) =>
  new File([new ArrayBuffer(size)], 'f.jpg', { type: 'image/jpeg' });

const latestUpload = () => MockUpload.instances[MockUpload.instances.length - 1];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createChunkStrategy', () => {
  it('passes the media id and file metadata to tus.Upload', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'my-id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: new AbortController().signal,
    });

    latestUpload().options.onSuccess();
    await uploadPromise;

    expect(latestUpload().options.metadata).toEqual({
      id: 'my-id',
      filename: 'f.jpg',
      filetype: 'image/jpeg',
    });
  });

  it('reports progress as a percentage', async () => {
    const onProgress = jest.fn();
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress,
      signal: new AbortController().signal,
    });

    latestUpload().options.onProgress(50, 200);
    latestUpload().options.onSuccess();
    await uploadPromise;

    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it('resolves with the tus upload URL on success', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: new AbortController().signal,
    });

    latestUpload().options.onSuccess();
    const url = await uploadPromise;

    expect(url).toBe('https://cdn/tus/abc');
  });

  it('rejects with the tus error on failure', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: new AbortController().signal,
    });

    latestUpload().options.onError(new Error('tus failed'));

    await expect(uploadPromise).rejects.toThrow('tus failed');
  });

  it('aborts the underlying upload and rejects when the signal fires', async () => {
    const ctrl = new AbortController();
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: ctrl.signal,
    });

    ctrl.abort();

    await expect(uploadPromise).rejects.toThrow();
    expect(latestUpload().aborted).toBe(true);
  });

  it('rejects immediately without constructing an upload when the signal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const strategy = createChunkStrategy();

    await expect(
      strategy.upload({
        id: 'id',
        file: fileOf(10),
        onProgress: jest.fn(),
        signal: ctrl.signal,
      }),
    ).rejects.toThrow();

    expect(MockUpload.instances).toHaveLength(0);
  });

  it('uses env.NEXT_PUBLIC_API_URL/uploads as the default endpoint', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'my-id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: new AbortController().signal,
    });
    latestUpload().options.onSuccess();
    await uploadPromise;

    expect(latestUpload().options.endpoint).toBe(`${env.NEXT_PUBLIC_API_URL}/uploads`);
  });

  it('appends uploadSessionId from options to tus metadata', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'my-id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: new AbortController().signal,
      options: { uploadSessionId: 'session-xyz' },
    });

    latestUpload().options.onSuccess();
    await uploadPromise;

    expect(latestUpload().options.metadata).toEqual({
      id: 'my-id',
      filename: 'f.jpg',
      filetype: 'image/jpeg',
      uploadSessionId: 'session-xyz',
    });
  });

  it('guards against division by zero when bytesTotal is 0', async () => {
    const onProgress = jest.fn();
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress,
      signal: new AbortController().signal,
    });

    latestUpload().options.onProgress(0, 0);
    latestUpload().options.onSuccess();
    await uploadPromise;

    expect(onProgress).toHaveBeenCalledWith(0);
  });

  it('rejects the promise if findPreviousUploads rejects', async () => {
    MockUpload.mockFindPreviousUploads = () => Promise.reject(new Error('Storage failure'));

    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: new AbortController().signal,
    });

    await expect(uploadPromise).rejects.toThrow('Storage failure');
  });

  it('cleans up the abort signal listener on success, failure, abort, or findPreviousUploads rejection', async () => {
    const strategy = createChunkStrategy();

    // Case 1: Success cleanup
    const signal1 = new AbortController().signal;
    const addSpy1 = jest.spyOn(signal1, 'addEventListener');
    const removeSpy1 = jest.spyOn(signal1, 'removeEventListener');

    const promise1 = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: signal1,
    });

    const listener1 = addSpy1.mock.calls[0][1];
    latestUpload().options.onSuccess();
    await promise1;
    expect(removeSpy1).toHaveBeenCalledWith('abort', listener1);

    // Case 2: Failure cleanup
    const signal2 = new AbortController().signal;
    const addSpy2 = jest.spyOn(signal2, 'addEventListener');
    const removeSpy2 = jest.spyOn(signal2, 'removeEventListener');

    const promise2 = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: signal2,
    });

    const listener2 = addSpy2.mock.calls[0][1];
    latestUpload().options.onError(new Error('fail'));
    await expect(promise2).rejects.toThrow('fail');
    expect(removeSpy2).toHaveBeenCalledWith('abort', listener2);

    // Case 3: Abort cleanup
    const ctrl3 = new AbortController();
    const addSpy3 = jest.spyOn(ctrl3.signal, 'addEventListener');
    const removeSpy3 = jest.spyOn(ctrl3.signal, 'removeEventListener');

    const promise3 = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: ctrl3.signal,
    });

    const listener3 = addSpy3.mock.calls[0][1];
    ctrl3.abort();
    await expect(promise3).rejects.toThrow();
    expect(removeSpy3).toHaveBeenCalledWith('abort', listener3);

    // Case 4: findPreviousUploads rejection cleanup
    MockUpload.mockFindPreviousUploads = () => Promise.reject(new Error('Storage failure'));
    const signal4 = new AbortController().signal;
    const addSpy4 = jest.spyOn(signal4, 'addEventListener');
    const removeSpy4 = jest.spyOn(signal4, 'removeEventListener');

    const promise4 = strategy.upload({
      id: 'id',
      file: fileOf(10),
      onProgress: jest.fn(),
      signal: signal4,
    });

    const listener4 = addSpy4.mock.calls[0][1];
    await expect(promise4).rejects.toThrow('Storage failure');
    expect(removeSpy4).toHaveBeenCalledWith('abort', listener4);
  });
});
