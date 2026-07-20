import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useMediaStore } from '../services/mediaStore';
import { createChunkStrategy } from '../services/chunkStrategy';
import { createUploadService } from '../services/uploadService';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('../services/chunkStrategy', () => ({
  createChunkStrategy: jest.fn(),
}));

jest.mock('../services/uploadService', () => {
  const actual = jest.requireActual('../services/uploadService');
  return { ...actual, createUploadService: jest.fn(actual.createUploadService) };
});

jest.mock('sonner', () => ({
  toast: { warning: jest.fn(), error: jest.fn() },
}));

jest.mock('../services/uploadSession', () => ({
  useUploadSession: () => ({ isPending: false }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const JPEG_HEADER = new Uint8Array([0xFF, 0xD8, 0xFF, 0xC0, 0, 0x0B, 8, 3, 0x20, 3, 0x20, 3, 0, 0, 0, 0]);
const jpg = (name = 'photo.jpg') => new File([JPEG_HEADER], name, { type: 'image/jpeg' });

let mockUpload: jest.Mock;
let uuidCounter = 0;
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  uuidCounter = 0;
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  mockUpload = jest.fn().mockResolvedValue('https://cdn/uploaded.jpg');
  (createChunkStrategy as jest.Mock).mockReturnValue({ upload: mockUpload });

  useMediaStore.setState({
    itemMap: new Map(),
    selectedIds: [],
    activePreviewIdx: 0,
    uploadSessionId: 'mock-session-123',
    expiresAt: '2026-07-13T15:00:00Z',
  });

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
    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items[0]?.status).toBe('uploaded');
    });

    unmount();
  });

  it('sets uploadedUrl after a successful upload', async () => {
    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items[0]?.uploadedUrl).toBe('https://cdn/uploaded.jpg');
    });

    unmount();
  });

  it('removes an item from the gallery when the upload rejects', async () => {
    mockUpload.mockRejectedValue(new Error('network error'));

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      expect(useMediaStore.getState().itemMap.size).toBe(0);
    });

    unmount();
  });
});

// ── Service initialization ────────────────────────────────────────────────────

describe('useMediaUpload — service initialization', () => {
  it('creates the upload service only once across re-renders', () => {
    const { rerender, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    rerender();
    rerender();

    expect(createUploadService).toHaveBeenCalledTimes(1);
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

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

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

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

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

// ── MAX_IMAGES limit ──────────────────────────────────────────────────────────

describe('useMediaUpload — MAX_IMAGES limit', () => {
  it('does not add any files once the MAX_IMAGES limit is reached', () => {
    const itemMap = new Map(
      Array.from({ length: 10 }, (_, i) => [
        `existing-${i}`,
        { id: `existing-${i}`, name: 'x.jpg', file: null, localUrl: 'blob:x', status: 'uploaded' as const, progress: 100, mediaKind: 'image' as const, validated: true },
      ]),
    );
    useMediaStore.setState({ itemMap });

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });
    act(() => { result.current.addFiles([jpg()]); });

    expect(useMediaStore.getState().itemMap.size).toBe(10);
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

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

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

  it('keeps status cancelled when the aborted upload promise eventually rejects', async () => {
    let rejectUpload!: (err: Error) => void;
    mockUpload.mockImplementation(
      () => new Promise<string>((_resolve, reject) => { rejectUpload = reject; }),
    );

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

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

    // The underlying fetch rejects because the abort propagated to it.
    act(() => { rejectUpload(new Error('aborted')); });

    await waitFor(() => {
      expect(useMediaStore.getState().itemMap.get(uploadId)?.status).toBe('cancelled');
    });

    unmount();
  });

  it('does not crash when cancelling an id that does not exist', () => {
    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });
    expect(() => {
      act(() => { result.current.cancelUpload('non-existent-id'); });
    }).not.toThrow();
    unmount();
  });
});

// ── retryUpload ───────────────────────────────────────────────────────────────

describe('useMediaUpload — retryUpload', () => {
  it('retry is a no-op when the item was already removed after failure', async () => {
    mockUpload
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('https://cdn/retried.jpg');

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    act(() => { result.current.addFiles([jpg()]); });

    await waitFor(() => {
      expect(useMediaStore.getState().itemMap.size).toBe(0);
    });

    // retry should not crash — item is already gone
    act(() => { result.current.retryUpload('non-existent-id'); });

    unmount();
  });

  it('does not crash when retrying an id that does not exist', () => {
    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });
    expect(() => {
      act(() => { result.current.retryUpload('non-existent-id'); });
    }).not.toThrow();
    unmount();
  });
});

// ── removeItem ───────────────────────────────────────────────────────────────

describe('useMediaUpload — removeItem', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
  });

  it('cancels the upload, removes the item from store, and calls delete API if uploadedUrl exists', async () => {
    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    // 1. Add item with uploadedUrl
    act(() => {
      useMediaStore.setState({
        itemMap: new Map([
          ['item-id', {
            id: 'item-id',
            name: 'photo.jpg',
            file: null,
            localUrl: 'blob:local',
            status: 'uploaded',
            progress: 100,
            mediaKind: 'image',
            uploadedUrl: 'https://cdn/item-id',
            validated: true
          }]
        ])
      });
    });

    // 2. Call removeItem
    act(() => {
      result.current.removeItem('item-id');
    });

    // 3. Verify item is removed from store
    expect(useMediaStore.getState().itemMap.has('item-id')).toBe(false);

    // 4. Verify fetch was called with DELETE
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/upload-sessions/mock-session-123/photos/item-id',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    );

    unmount();
  });



  it('does not call the delete API when the item has no uploadedUrl', () => {
    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    act(() => {
      useMediaStore.setState({
        itemMap: new Map([
          ['item-id', {
            id: 'item-id',
            name: 'photo.jpg',
            file: null,
            localUrl: 'blob:local',
            status: 'failed',
            progress: 0,
            mediaKind: 'image',
            validated: true
          }]
        ])
      });
    });

    act(() => {
      result.current.removeItem('item-id');
    });

    expect(useMediaStore.getState().itemMap.has('item-id')).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();

    unmount();
  });
});

// ── slot opened after cancelUpload already fired ──────────────────────────────

describe('useMediaUpload — race with cancellation', () => {
  it('skips the upload when its slot starts after cancelUpload already removed the controller', async () => {
    const resolveFns: Array<(url: string) => void> = [];
    mockUpload.mockImplementation(
      () => new Promise<string>((resolve) => { resolveFns.push(resolve); }),
    );

    const { result, unmount } = renderHook(() => useMediaUpload(), { wrapper });

    const files = [jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg'), jpg('d.jpg')];
    act(() => { result.current.addFiles(files); });

    await waitFor(() => {
      expect([...useMediaStore.getState().itemMap.values()].filter((i) => i.status === 'uploading')).toHaveLength(3);
    });

    const queuedItem = [...useMediaStore.getState().itemMap.values()].find((i) => i.status === 'queued')!;

    // Cancel the still-queued item before its turn comes up in the p-limit queue.
    act(() => { result.current.cancelUpload(queuedItem.id); });
    expect(useMediaStore.getState().itemMap.get(queuedItem.id)?.status).toBe('cancelled');

    // Free a slot — the queued task now runs, but its controller was already removed.
    act(() => { resolveFns[0]('https://cdn/f.jpg'); });

    await waitFor(() => {
      // mockUpload should never have been called for the cancelled item.
      expect(mockUpload).toHaveBeenCalledTimes(3);
    });

    expect(useMediaStore.getState().itemMap.get(queuedItem.id)?.status).toBe('cancelled');

    resolveFns.slice(1).forEach((fn) => fn('https://cdn/f.jpg'));
    unmount();
  });
});

