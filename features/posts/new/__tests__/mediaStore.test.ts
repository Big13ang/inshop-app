import { createMediaStore } from '../services/mediaStore';
import type { MediaItem } from '../types';

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

beforeEach(() => {
  global.URL.revokeObjectURL = jest.fn();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('mediaStore', () => {

  // Slice 1 — addItems appends, does NOT replace (bug fix for initUpload)
  it('addItems appends new items to existing ones', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'a' })]);
    store.getState().addItems([item({ id: 'b' })]);

    expect(store.getState().itemMap.size).toBe(2);
    expect(store.getState().itemMap.has('a')).toBe(true);
    expect(store.getState().itemMap.has('b')).toBe(true);
  });

  it('addItems is idempotent — adding the same id twice updates the entry', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'a', progress: 0 })]);
    store.getState().addItems([item({ id: 'a', progress: 50 })]);

    expect(store.getState().itemMap.size).toBe(1);
    expect(store.getState().itemMap.get('a')!.progress).toBe(50);
  });

  // Slice 2 — removeItem deletes the entry and revokes its blob URL
  it('removeItem deletes the item and calls URL.revokeObjectURL', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'x', localUrl: 'blob:my-url' })]);
    store.getState().removeItem('x');

    expect(store.getState().itemMap.has('x')).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:my-url');
  });

  it('removeItem also cleans selectedIds', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'u', status: 'uploaded' })]);
    store.getState().toggleSelected('u');
    store.getState().removeItem('u');

    expect(store.getState().selectedIds).not.toContain('u');
  });

  // Slice 3 — toggleSelected only works for uploaded items
  it('toggleSelected ignores items that are not uploaded', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'q', status: 'queued' })]);
    store.getState().toggleSelected('q');

    expect(store.getState().selectedIds).toHaveLength(0);
  });

  it('toggleSelected adds an uploaded item to selectedIds', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'u', status: 'uploaded' })]);
    store.getState().toggleSelected('u');

    expect(store.getState().selectedIds).toContain('u');
  });

  it('toggleSelected removes an already-selected item', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'u', status: 'uploaded' })]);
    store.getState().toggleSelected('u');
    store.getState().toggleSelected('u');

    expect(store.getState().selectedIds).toHaveLength(0);
  });

  it('toggleSelected preserves insertion order', () => {
    const store = createMediaStore();
    store.getState().addItems([
      item({ id: 'a', status: 'uploaded' }),
      item({ id: 'b', status: 'uploaded' }),
      item({ id: 'c', status: 'uploaded' }),
    ]);
    store.getState().toggleSelected('a');
    store.getState().toggleSelected('c');
    store.getState().toggleSelected('b');

    expect(store.getState().selectedIds).toEqual(['a', 'c', 'b']);
  });

  // Slice 4 — _setStatus auto-removes from selectedIds when non-uploaded
  it('_setStatus removes item from selectedIds when it becomes failed', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'u', status: 'uploaded' })]);
    store.getState().toggleSelected('u');

    store.getState()._setStatus('u', 'failed');

    expect(store.getState().selectedIds).not.toContain('u');
    expect(store.getState().itemMap.get('u')!.status).toBe('failed');
  });

  it('_setStatus does not remove from selectedIds when transitioning to uploaded', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'u', status: 'uploaded' })]);
    store.getState().toggleSelected('u');

    store.getState()._setStatus('u', 'uploaded'); // no-op for selectedIds

    expect(store.getState().selectedIds).toContain('u');
  });

  // Slice 5 — _setUploaded sets URL, nulls file, sets status, sets progress=100
  it('_setUploaded sets uploadedUrl, nulls file reference, and marks status uploaded', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'f' })]);
    store.getState()._setUploaded('f', 'https://cdn.example.com/f.jpg');

    const result = store.getState().itemMap.get('f')!;
    expect(result.uploadedUrl).toBe('https://cdn.example.com/f.jpg');
    expect(result.file).toBeNull();
    expect(result.status).toBe('uploaded');
    expect(result.progress).toBe(100);
  });

  // Slice 6 — _setProgress updates only the progress field
  it('_setProgress updates progress without touching status', () => {
    const store = createMediaStore();
    store.getState().addItems([item({ id: 'p', status: 'uploading', progress: 0 })]);
    store.getState()._setProgress('p', 42);

    const result = store.getState().itemMap.get('p')!;
    expect(result.progress).toBe(42);
    expect(result.status).toBe('uploading');
  });

  // Slice 7 — each store from createMediaStore is isolated
  it('createMediaStore creates isolated stores — state does not bleed between instances', () => {
    const storeA = createMediaStore();
    const storeB = createMediaStore();
    storeA.getState().addItems([item({ id: 'shared-id' })]);

    expect(storeB.getState().itemMap.has('shared-id')).toBe(false);
  });
});
