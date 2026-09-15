import { createMediaStore } from '../mediaStore';
import { type MediaItem } from '../../types';

function createMockItem(id: string, previewUrl: string | null = `blob:${id}`): MediaItem {
  return {
    id,
    serverMediaId: `server-${id}`,
    kind: 'image',
    status: 'uploaded',
    uploadProgress: 100,
    order: 1,
    previewUrl,
    file: new File([''], `${id}.jpg`, { type: 'image/jpeg' }),
    isValid: true,
  };
}

describe('mediaStore', () => {
  let revokeObjectURLSpy: jest.SpyInstance;

  beforeEach(() => {
    // In jsdom URL.revokeObjectURL is a mock function or can be spied on
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = jest.fn();
    }
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    revokeObjectURLSpy.mockRestore();
  });

  it('initializes with default values', () => {
    const store = createMediaStore();
    const state = store.getState();

    expect(state.phase).toBe('select');
    expect(state.caption).toBe('');
    expect(state.mediaList).toEqual([]);
    expect(state.isValidating).toBe(false);
    expect(state.uploadSessionId).toBeNull();
  });

  it('updates phase via setPhase', () => {
    const store = createMediaStore();
    store.getState().setPhase('details');
    expect(store.getState().phase).toBe('details');

    store.getState().setPhase('select');
    expect(store.getState().phase).toBe('select');
  });

  it('updates caption via setCaption', () => {
    const store = createMediaStore();
    store.getState().setCaption('کفش ورزشی نایک اصل سایز ۴۲');
    expect(store.getState().caption).toBe('کفش ورزشی نایک اصل سایز ۴۲');
  });

  it('updates isValidating via setIsValidating', () => {
    const store = createMediaStore();
    store.getState().setIsValidating(true);
    expect(store.getState().isValidating).toBe(true);
  });

  it('updates uploadSessionId via setUploadSessionId', () => {
    const store = createMediaStore();
    store.getState().setUploadSessionId('session-xyz-123');
    expect(store.getState().uploadSessionId).toBe('session-xyz-123');
  });

  it('updates mediaList via setMediaList', () => {
    const store = createMediaStore();
    const items = [createMockItem('item-1'), createMockItem('item-2')];

    store.getState().setMediaList(items);
    expect(store.getState().mediaList).toHaveLength(2);
    expect(store.getState().mediaList[0].id).toBe('item-1');
  });

  it('patches target item immutably via patchItem', () => {
    const store = createMediaStore();
    const item1 = createMockItem('item-1');
    const item2 = createMockItem('item-2');
    store.getState().setMediaList([item1, item2]);

    store.getState().patchItem('item-1', {
      uploadProgress: 75,
      status: 'uploading',
    });

    const updated = store.getState().mediaList;
    expect(updated[0].uploadProgress).toBe(75);
    expect(updated[0].status).toBe('uploading');
    expect(updated[1].uploadProgress).toBe(100); // Unchanged
  });

  it('removes item and revokes preview URL via removeItem', () => {
    const store = createMediaStore();
    const item1 = createMockItem('item-1', 'blob:http://localhost/item-1');
    const item2 = createMockItem('item-2', 'blob:http://localhost/item-2');
    store.getState().setMediaList([item1, item2]);

    store.getState().removeItem('item-1');

    expect(store.getState().mediaList).toHaveLength(1);
    expect(store.getState().mediaList[0].id).toBe('item-2');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/item-1');
  });

  it('resets all state and revokes all preview URLs via reset', () => {
    const store = createMediaStore();
    const item1 = createMockItem('item-1', 'blob:http://localhost/item-1');
    const item2 = createMockItem('item-2', 'blob:http://localhost/item-2');
    const itemWithoutBlob = createMockItem('item-3', null);

    store.getState().setMediaList([item1, item2, itemWithoutBlob]);
    store.getState().setPhase('details');
    store.getState().setCaption('Some caption');
    store.getState().setUploadSessionId('session-123');
    store.getState().setIsValidating(true);

    store.getState().reset();

    const state = store.getState();
    expect(state.phase).toBe('select');
    expect(state.caption).toBe('');
    expect(state.mediaList).toEqual([]);
    expect(state.isValidating).toBe(false);
    expect(state.uploadSessionId).toBeNull();

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/item-1');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/item-2');
  });
});
