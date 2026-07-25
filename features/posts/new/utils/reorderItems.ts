import { MediaItem } from '../types';

/**
 * Toggles the selection order of a media item by ID.
 * - If deselecting (order !== null): sets order to null and shifts higher orders down by 1.
 * - If selecting (order === null): assigns order = maxOrder + 1.
 */
export function reorderItems(mediaList: MediaItem[], targetId: string): MediaItem[] {
  const targetItem = mediaList.find((item) => item.id === targetId);
  if (!targetItem) return mediaList;

  if (targetItem.order !== null) {
    const removedOrder = targetItem.order;

    return mediaList.map((item) => {
      if (item.id === targetId) {
        return { ...item, order: null };
      }
      if (item.order !== null && item.order > removedOrder) {
        return { ...item, order: item.order - 1 };
      }
      return item;
    });
  }

  const maxOrder = mediaList.reduce((max, item) => {
    return item.order !== null ? Math.max(max, item.order) : max;
  }, 0);

  return mediaList.map((item) => {
    if (item.id === targetId) {
      return { ...item, order: maxOrder + 1 };
    }
    return item;
  });
}
