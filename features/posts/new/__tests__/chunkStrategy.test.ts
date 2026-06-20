import { createChunkStrategy } from '../services/chunkStrategy';

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
    url: string | null = 'https://cdn/tus/abc';
    options: UploadOptions;
    aborted = false;

    constructor(_file: File, options: UploadOptions) {
      this.options = options;
      MockUpload.instances.push(this);
    }

    findPreviousUploads() {
      return Promise.resolve([]);
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
} }>('tus-js-client').Upload;

beforeEach(() => {
  MockUpload.instances = [];
});

const fileOf = (size: number) =>
  new File([new ArrayBuffer(size)], 'f.jpg', { type: 'image/jpeg' });

const latestUpload = () => MockUpload.instances[MockUpload.instances.length - 1];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createChunkStrategy', () => {
  it('passes the media id and file metadata to tus.Upload', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload('my-id', fileOf(10), jest.fn(), new AbortController().signal);

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
    const uploadPromise = strategy.upload('id', fileOf(10), onProgress, new AbortController().signal);

    latestUpload().options.onProgress(50, 200);
    latestUpload().options.onSuccess();
    await uploadPromise;

    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it('resolves with the tus upload URL on success', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload('id', fileOf(10), jest.fn(), new AbortController().signal);

    latestUpload().options.onSuccess();
    const url = await uploadPromise;

    expect(url).toBe('https://cdn/tus/abc');
  });

  it('rejects with the tus error on failure', async () => {
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload('id', fileOf(10), jest.fn(), new AbortController().signal);

    latestUpload().options.onError(new Error('tus failed'));

    await expect(uploadPromise).rejects.toThrow('tus failed');
  });

  it('aborts the underlying upload and rejects when the signal fires', async () => {
    const ctrl = new AbortController();
    const strategy = createChunkStrategy();
    const uploadPromise = strategy.upload('id', fileOf(10), jest.fn(), ctrl.signal);

    ctrl.abort();

    await expect(uploadPromise).rejects.toThrow();
    expect(latestUpload().aborted).toBe(true);
  });

  it('rejects immediately without constructing an upload when the signal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const strategy = createChunkStrategy();

    await expect(
      strategy.upload('id', fileOf(10), jest.fn(), ctrl.signal),
    ).rejects.toThrow();

    expect(MockUpload.instances).toHaveLength(0);
  });
});
