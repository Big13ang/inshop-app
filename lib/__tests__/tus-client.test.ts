import { tusUpload } from '../tus-client';

type PreviousUploadStub = {
  uploadUrl: string | null;
  urlStorageKey: string;
};

type UploadOptionsStub = {
  endpoint: string;
  metadata: Record<string, string>;
  urlStorage?: { removeUpload: jest.Mock };
  onError: (error: Error) => void;
};

const mockState: {
  previous: PreviousUploadStub[];
  findError: Error | null;
  instances: Array<{
    options: UploadOptionsStub;
    findPreviousUploads: jest.Mock;
    resumeFromPreviousUpload: jest.Mock;
    start: jest.Mock;
  }>;
  removeUpload: jest.Mock;
} = { previous: [], findError: null, instances: [], removeUpload: jest.fn() };

jest.mock('tus-js-client', () => ({
  Upload: jest.fn().mockImplementation((_file: File, options: UploadOptionsStub) => {
    const instance = {
      options: { ...options, urlStorage: { removeUpload: mockState.removeUpload } },
      findPreviousUploads: jest.fn(() =>
        mockState.findError ? Promise.reject(mockState.findError) : Promise.resolve(mockState.previous),
      ),
      resumeFromPreviousUpload: jest.fn(),
      start: jest.fn(),
    };
    mockState.instances.push(instance);
    return instance;
  }),
}));

const ENDPOINT = 'https://api.example.com/uploads';

function startUpload(file = new File(['x'], 'photo.webp', { type: 'image/webp' }), onError?: (e: Error) => void) {
  const promise = tusUpload({ file, id: 'id-1', endpoint: ENDPOINT, onError });
  return { promise, instance: () => mockState.instances[0] };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('tusUpload resume + metadata', () => {
  beforeEach(() => {
    mockState.previous = [];
    mockState.findError = null;
    mockState.instances = [];
    mockState.removeUpload = jest.fn().mockResolvedValue(undefined);
  });

  it('resumes a previous upload under the endpoint', async () => {
    const match = { uploadUrl: `${ENDPOINT}/abc`, urlStorageKey: 'k1' };
    mockState.previous = [match];
    const { instance } = startUpload();
    await flush();

    expect(instance().resumeFromPreviousUpload).toHaveBeenCalledWith(match);
    expect(instance().start).toHaveBeenCalledTimes(1);
  });

  it('ignores other-host entries and starts fresh', async () => {
    mockState.previous = [{ uploadUrl: 'https://evil.example.net/uploads/abc', urlStorageKey: 'k1' }];
    const { instance } = startUpload();
    await flush();

    expect(instance().resumeFromPreviousUpload).not.toHaveBeenCalled();
    expect(instance().start).toHaveBeenCalledTimes(1);
  });

  it('ignores entries with a null uploadUrl', async () => {
    mockState.previous = [{ uploadUrl: null, urlStorageKey: 'k1' }];
    const { instance } = startUpload();
    await flush();

    expect(instance().resumeFromPreviousUpload).not.toHaveBeenCalled();
    expect(instance().start).toHaveBeenCalledTimes(1);
  });

  it('picks the matching entry even when it is not first', async () => {
    const match = { uploadUrl: `${ENDPOINT}/second`, urlStorageKey: 'k2' };
    mockState.previous = [{ uploadUrl: 'https://other.example.com/uploads/x', urlStorageKey: 'k1' }, match];
    const { instance } = startUpload();
    await flush();

    expect(instance().resumeFromPreviousUpload).toHaveBeenCalledWith(match);
  });

  it('does not treat /uploads-old/... as matching /uploads', async () => {
    mockState.previous = [{ uploadUrl: 'https://api.example.com/uploads-old/abc', urlStorageKey: 'k1' }];
    const { instance } = startUpload();
    await flush();

    expect(instance().resumeFromPreviousUpload).not.toHaveBeenCalled();
  });

  it('normalizes a trailing slash on the endpoint', async () => {
    const match = { uploadUrl: `${ENDPOINT}/abc`, urlStorageKey: 'k1' };
    mockState.previous = [match];
    const promise = tusUpload({ file: new File(['x'], 'a.webp', { type: 'image/webp' }), id: 'i', endpoint: `${ENDPOINT}/` });
    void promise;
    await flush();

    expect(mockState.instances[0].resumeFromPreviousUpload).toHaveBeenCalledWith(match);
  });

  it('removes stale entries from url storage', async () => {
    const match = { uploadUrl: `${ENDPOINT}/ok`, urlStorageKey: 'keep' };
    mockState.previous = [
      { uploadUrl: 'https://other.example.com/uploads/x', urlStorageKey: 'stale-1' },
      { uploadUrl: null, urlStorageKey: 'stale-2' },
      match,
    ];
    startUpload();
    await flush();

    expect(mockState.removeUpload).toHaveBeenCalledWith('stale-1');
    expect(mockState.removeUpload).toHaveBeenCalledWith('stale-2');
    expect(mockState.removeUpload).not.toHaveBeenCalledWith('keep');
  });

  it('still starts when removing a stale entry fails', async () => {
    mockState.removeUpload = jest.fn().mockRejectedValue(new Error('storage broke'));
    mockState.previous = [{ uploadUrl: 'https://other.example.com/uploads/x', urlStorageKey: 'stale' }];
    const { instance } = startUpload();
    await flush();

    expect(instance().start).toHaveBeenCalledTimes(1);
  });

  it('sends filename and filetype metadata from the passed file', async () => {
    const { instance } = startUpload(new File(['x'], 'photo.webp', { type: 'image/webp' }));
    await flush();

    expect(instance().options.metadata).toMatchObject({ id: 'id-1', filename: 'photo.webp', filetype: 'image/webp' });
  });

  it('resolves Result.err and calls onError when findPreviousUploads rejects', async () => {
    mockState.findError = new Error('idb unavailable');
    const onError = jest.fn();
    const { promise, instance } = startUpload(undefined, onError);

    const result = await promise;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('idb unavailable');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(instance().start).not.toHaveBeenCalled();
  });
});
