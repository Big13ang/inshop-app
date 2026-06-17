import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useMediaStore } from '../services/mediaStore';
import { createChunkStrategy } from '../services/chunkStrategy';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('../services/chunkStrategy', () => ({
  createChunkStrategy: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { warning: jest.fn(), error: jest.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const jpg = (name = 'photo.jpg') => new File(['x'], name, { type: 'image/jpeg' });

let mockUpload: jest.Mock;
let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;

  mockUpload = jest.fn().mockResolvedValue('https://cdn/uploaded.jpg');
  (createChunkStrategy as jest.Mock).mockReturnValue({ upload: mockUpload });

  useMediaStore.setState({ itemMap: new Map(), selectedIds: [], activePreviewIdx: 0 });

  global.URL.createObjectURL = jest.fn(() => 'blob:local');
  global.URL.revokeObjectURL = jest.fn();
  global.crypto.randomUUID = jest.fn(
    () =>
      `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, '0')}` as `${string}-${string}-${string}-${string}-${string}`,
  );

  localStorage.clear();
});

afterEach(() => {
  jest.clearAllMocks();
});

// ── addFiles — happy path ─────────────────────────────────────────────────────

describe('useMediaUpload — addFiles', () => {
  it('transitions a file from queued → uploading → uploaded on success', async () => {
    const { result, unmount } = renderHook(() => useMediaUpload());

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items[0]?.status).toBe('uploaded');
    });

    unmount();
  });

  it('sets uploadedUrl after a successful upload', async () => {
    const { result, unmount } = renderHook(() => useMediaUpload());

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items[0]?.uploadedUrl).toBe('https://cdn/uploaded.jpg');
    });

    unmount();
  });

  it('marks an item as failed when the upload rejects', async () => {
    mockUpload.mockRejectedValue(new Error('network error'));

    const { result, unmount } = renderHook(() => useMediaUpload());

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items[0]?.status).toBe('failed');
    });

    unmount();
  });
});

// ── Concurrency ───────────────────────────────────────────────────────────────

describe('useMediaUpload — concurrency', () => {
  it('limits concurrent uploads to 3; the 4th file stays queued', async () => {
    const resolveFns: Array<(url: string) => void> = [];
    mockUpload.mockImplementation(
      () => new Promise<string>((resolve) => { resolveFns.push(resolve); }),
    );

    const { result, unmount } = renderHook(() => useMediaUpload());

    const files = [jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg'), jpg('d.jpg')];
    act(() => { result.current.addFiles(files); });

    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items.filter((i) => i.status === 'uploading')).toHaveLength(3);
    });

    const items = [...useMediaStore.getState().itemMap.values()];
    expect(items.filter((i) => i.status === 'queued')).toHaveLength(1);

    // Resolve all to allow clean unmount
    resolveFns.forEach((fn) => fn('https://cdn/f.jpg'));
    unmount();
  });

  it('starts the 4th upload once a slot frees up', async () => {
    const resolveFns: Array<(url: string) => void> = [];
    mockUpload.mockImplementation(
      () => new Promise<string>((resolve) => { resolveFns.push(resolve); }),
    );

    const { result, unmount } = renderHook(() => useMediaUpload());

    act(() => { result.current.addFiles([jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg'), jpg('d.jpg')]); });

    // Wait until 3 are uploading
    await waitFor(() => {
      expect([...useMediaStore.getState().itemMap.values()].filter((i) => i.status === 'uploading')).toHaveLength(3);
    });

    // Free one slot by resolving the first upload
    act(() => { resolveFns[0]('https://cdn/1.jpg'); });

    // The 4th file should now start — nothing should remain 'queued'
    await waitFor(() => {
      const queued = [...useMediaStore.getState().itemMap.values()].filter((i) => i.status === 'queued');
      expect(queued).toHaveLength(0);
    });

    // Slot 1 uploaded, slots 2-4 are still uploading (deferred promises pending)
    const items = [...useMediaStore.getState().itemMap.values()];
    expect(items.filter((i) => i.status === 'uploaded')).toHaveLength(1);
    expect(items.filter((i) => i.status === 'uploading')).toHaveLength(3);

    resolveFns.slice(1).forEach((fn) => fn('https://cdn/f.jpg'));
    unmount();
  });
});

// ── cancelUpload ──────────────────────────────────────────────────────────────

describe('useMediaUpload — cancelUpload', () => {
  it('aborts an in-flight upload and marks it cancelled', async () => {
    let resolveUpload!: (url: string) => void;
    mockUpload.mockImplementation(
      () => new Promise<string>((resolve) => { resolveUpload = resolve; }),
    );

    const { result, unmount } = renderHook(() => useMediaUpload());

    act(() => { result.current.addFiles([jpg()]); });

    let uploadId!: string;
    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      const uploading = items.find((i) => i.status === 'uploading');
      expect(uploading).toBeDefined();
      uploadId = uploading!.id;
    });

    act(() => { result.current.cancelUpload(uploadId); });

    expect(useMediaStore.getState().itemMap.get(uploadId)?.status).toBe('cancelled');

    resolveUpload('https://cdn/f.jpg');
    unmount();
  });

  it('does not crash when cancelling an id that does not exist', () => {
    const { result, unmount } = renderHook(() => useMediaUpload());
    expect(() => {
      act(() => { result.current.cancelUpload('non-existent-id'); });
    }).not.toThrow();
    unmount();
  });
});

// ── retryUpload ───────────────────────────────────────────────────────────────

describe('useMediaUpload — retryUpload', () => {
  it('requeues a failed item and marks it uploaded on the next attempt', async () => {
    mockUpload
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('https://cdn/retried.jpg');

    const { result, unmount } = renderHook(() => useMediaUpload());

    act(() => { result.current.addFiles([jpg()]); });

    let failedId!: string;
    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      const failed = items.find((i) => i.status === 'failed');
      expect(failed).toBeDefined();
      failedId = failed!.id;
    });

    act(() => { result.current.retryUpload(failedId); });

    await waitFor(() => {
      expect(useMediaStore.getState().itemMap.get(failedId)?.status).toBe('uploaded');
      expect(useMediaStore.getState().itemMap.get(failedId)?.uploadedUrl).toBe('https://cdn/retried.jpg');
    });

    unmount();
  });

  it('does not crash when retrying an id that does not exist', () => {
    const { result, unmount } = renderHook(() => useMediaUpload());
    expect(() => {
      act(() => { result.current.retryUpload('non-existent-id'); });
    }).not.toThrow();
    unmount();
  });
});
