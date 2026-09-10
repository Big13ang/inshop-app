import { reorderItems } from '../reorderItems';
import { type MediaItem } from '../../types';

const createMockItem = (id: string, order: number | null): MediaItem => ({
  id,
  serverMediaId: id,
  kind: 'image',
  status: 'uploaded',
  uploadProgress: 100,
  order,
  previewUrl: `blob:${id}`,
  file: new File([''], `${id}.jpg`, { type: 'image/jpeg' }),
  isValid: true,
});

describe('reorderItems utility', () => {
  it('selects the first item when all are unselected, assigning order = 1', () => {
    const mediaList = [
      createMockItem('item-1', null),
      createMockItem('item-2', null),
    ];

    const result = reorderItems(mediaList, 'item-1');
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBeNull();
  });

  it('selects an unselected item by assigning order = maxOrder + 1', () => {
    const mediaList = [
      createMockItem('item-1', 1),
      createMockItem('item-2', 2),
      createMockItem('item-3', null),
    ];

    const result = reorderItems(mediaList, 'item-3');
    expect(result[2].order).toBe(3);
  });

  it('deselects the first selected item and shifts all higher orders down by 1', () => {
    const mediaList = [
      createMockItem('item-1', 1),
      createMockItem('item-2', 2),
      createMockItem('item-3', 3),
    ];

    const result = reorderItems(mediaList, 'item-1');
    expect(result[0].order).toBeNull(); // item-1 deselected
    expect(result[1].order).toBe(1);    // item-2 shifted 2 -> 1
    expect(result[2].order).toBe(2);    // item-3 shifted 3 -> 2
  });

  it('deselects a middle selected item and shifts only higher order items down by 1', () => {
    const mediaList = [
      createMockItem('item-1', 1),
      createMockItem('item-2', 2),
      createMockItem('item-3', 3),
    ];

    const result = reorderItems(mediaList, 'item-2');
    expect(result[0].order).toBe(1);    // item-1 unchanged
    expect(result[1].order).toBeNull(); // item-2 deselected
    expect(result[2].order).toBe(2);    // item-3 shifted 3 -> 2
  });

  it('deselects the last selected item without affecting preceding items', () => {
    const mediaList = [
      createMockItem('item-1', 1),
      createMockItem('item-2', 2),
      createMockItem('item-3', 3),
    ];

    const result = reorderItems(mediaList, 'item-3');
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(2);
    expect(result[2].order).toBeNull();
  });

  it('handles deselecting the only selected item', () => {
    const mediaList = [
      createMockItem('item-1', null),
      createMockItem('item-2', 1),
      createMockItem('item-3', null),
    ];

    const result = reorderItems(mediaList, 'item-2');
    expect(result[0].order).toBeNull();
    expect(result[1].order).toBeNull();
    expect(result[2].order).toBeNull();
  });

  it('returns original array if target item is not found', () => {
    const mediaList = [createMockItem('item-1', 1)];
    const result = reorderItems(mediaList, 'non-existent');
    expect(result).toEqual(mediaList);
  });

  it('handles empty mediaList gracefully', () => {
    const result = reorderItems([], 'any-id');
    expect(result).toEqual([]);
  });

  it('maintains immutability and does not mutate the input array', () => {
    const originalItem = createMockItem('item-1', null);
    const mediaList = [originalItem];

    const result = reorderItems(mediaList, 'item-1');
    expect(result).not.toBe(mediaList);
    expect(originalItem.order).toBeNull();
    expect(result[0].order).toBe(1);
  });
});
