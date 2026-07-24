import { reorderItems } from '../reorderItems';
import { type MediaItem } from '../../types';

const createMockItem = (id: string, order: number | null): MediaItem => ({
  id,
  kind: 'image',
  status: 'uploaded',
  uploadProgress: 100,
  order,
  previewUrl: `blob:${id}`,
  file: new File([''], `${id}.jpg`, { type: 'image/jpeg' }),
  isValid: true,
});

describe('reorderItems utility', () => {
  it('selects an unselected item by assigning order = maxOrder + 1', () => {
    const mediaList = [
      createMockItem('item-1', 1),
      createMockItem('item-2', 2),
      createMockItem('item-3', null),
    ];

    const result = reorderItems(mediaList, 'item-3');
    expect(result[2].order).toBe(3);
  });

  it('deselects a selected item and shifts higher order items down by 1', () => {
    const mediaList = [
      createMockItem('item-1', 1),
      createMockItem('item-2', 2),
      createMockItem('item-3', 3),
    ];

    const result = reorderItems(mediaList, 'item-2');
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBeNull(); // item-2 deselected
    expect(result[2].order).toBe(2);    // item-3 shifted from 3 -> 2
  });

  it('returns original array if target item is not found', () => {
    const mediaList = [createMockItem('item-1', 1)];
    const result = reorderItems(mediaList, 'non-existent');
    expect(result).toEqual(mediaList);
  });
});
