import { createMediaStore } from '../services/mediaStore';
import { MediaItem } from '../types';

const item = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: 'test-id',
  file: new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
  previewUrl: 'blob:mock-url',
  status: 'pending',
  uploadProgress: 0,
  kind: 'image',
  isValid: true,
  order: 0,
  ...overrides,
});

describe('mediaStore', () => {
  beforeEach(() => {
    global.URL.revokeObjectURL = jest.fn();
  });

  it('initializes with default values', () => {
    const store = createMediaStore();
    const state = store.getState();

    expect(state.phase).toBe('select');
    expect(state.caption).toBe('');
    expect(state.mediaList).toEqual([]);
    expect(state.isValidating).toBe(false);
  });

  it('sets phase', () => {
    const store = createMediaStore();
    store.getState().setPhase('details');
    expect(store.getState().phase).toBe('details');
  });

  it('sets caption', () => {
    const store = createMediaStore();
    store.getState().setCaption('Hello world');
    expect(store.getState().caption).toBe('Hello world');
  });

  it('sets isValidating', () => {
    const store = createMediaStore();
    store.getState().setIsValidating(true);
    expect(store.getState().isValidating).toBe(true);
  });

  it('sets mediaList', () => {
    const store = createMediaStore();
    const media = [item({ id: '1' }), item({ id: '2' })];
    store.getState().setMediaList(media);
    expect(store.getState().mediaList).toEqual(media);
  });

  it('patches item fields by id', () => {
    const store = createMediaStore();
    store.getState().setMediaList([item({ id: '1', uploadProgress: 0 })]);
    store.getState().patchItem('1', { uploadProgress: 50, status: 'uploading' });

    const updated = store.getState().mediaList.find((i) => i.id === '1');
    expect(updated?.uploadProgress).toBe(50);
    expect(updated?.status).toBe('uploading');
  });

  it('removes item by id and revokes object URL', () => {
    const store = createMediaStore();
    store.getState().setMediaList([item({ id: '1', previewUrl: 'blob:mock-url' })]);
    store.getState().removeItem('1');

    expect(store.getState().mediaList).toEqual([]);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('sets uploadSessionId', () => {
    const store = createMediaStore();
    store.getState().setUploadSessionId('sess-123');
    expect(store.getState().uploadSessionId).toBe('sess-123');
  });

  it('resets store to default values and revokes object URLs', () => {
    const store = createMediaStore();
    store.getState().setMediaList([item({ id: '1', previewUrl: 'blob:1' }), item({ id: '2', previewUrl: 'blob:2' })]);
    store.getState().setCaption('Some text');
    store.getState().setPhase('details');
    store.getState().setUploadSessionId('sess-123');

    store.getState().reset();

    expect(store.getState().phase).toBe('select');
    expect(store.getState().caption).toBe('');
    expect(store.getState().mediaList).toEqual([]);
    expect(store.getState().uploadSessionId).toBeNull();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:2');
  });
});
