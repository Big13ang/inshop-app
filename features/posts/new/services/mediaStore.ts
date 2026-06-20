import { create, type StoreApi } from 'zustand';
import { type MediaItem, type MediaStatus } from '../types';

// ── State shape ───────────────────────────────────────────────────────────────

export interface MediaStoreState {
  /** O(1) lookup by ID. Insertion order is preserved by Map. */
  itemMap: Map<string, MediaItem>;
  /** Ordered IDs of *uploaded* items added to the post. */
  selectedIds: string[];
  activePreviewIdx: number;

  // ── Public actions ──────────────────────────────────────────────────────────
  /** Appends items — never replaces existing ones. */
  addItems(items: MediaItem[]): void;
  /** Removes the item and revokes its blob URL. */
  removeItem(id: string): void;
  /** Toggles selection — only works when item.status === 'uploaded'. */
  toggleSelected(id: string): void;

  // ── Internal actions (called by upload callbacks) ───────────────────────────
  _setStatus(id: string, status: MediaStatus): void;
  _setProgress(id: string, pct: number): void;
  /** Called on upload success — sets URL, nulls file ref, marks uploaded. */
  _setUploaded(id: string, uploadedUrl: string): void;
}

// ── Store factory (enables test isolation) ────────────────────────────────────

function clampPreviewIdx(idx: number, selectedCount: number): number {
  return Math.min(idx, Math.max(0, selectedCount - 1));
}

function buildStore(
  set: (fn: (s: MediaStoreState) => Partial<MediaStoreState>) => void,
): MediaStoreState {
  return {
    itemMap: new Map(),
    selectedIds: [],
    activePreviewIdx: 0,

    addItems(items) {
      set((s) => {
        const next = new Map(s.itemMap);
        for (const it of items) next.set(it.id, it);
        return { itemMap: next };
      });
    },

    removeItem(id) {
      set((s) => {
        const it = s.itemMap.get(id);
        if (it?.localUrl) URL.revokeObjectURL(it.localUrl);
        const next = new Map(s.itemMap);
        next.delete(id);
        const selectedIds = s.selectedIds.filter((sid) => sid !== id);
        return {
          itemMap: next,
          selectedIds,
          activePreviewIdx: clampPreviewIdx(s.activePreviewIdx, selectedIds.length),
        };
      });
    },

    toggleSelected(id) {
      set((s) => {
        const it = s.itemMap.get(id);
        if (!it || it.status !== 'uploaded') return {};
        const already = s.selectedIds.includes(id);
        const selectedIds = already
          ? s.selectedIds.filter((sid) => sid !== id)
          : [...s.selectedIds, id];
        return {
          selectedIds,
          activePreviewIdx: clampPreviewIdx(s.activePreviewIdx, selectedIds.length),
        };
      });
    },

    _setStatus(id, status) {
      set((s) => {
        const it = s.itemMap.get(id);
        if (!it) return {};
        const next = new Map(s.itemMap);
        next.set(id, { ...it, status });
        // Auto-evict from selectedIds when a previously-uploaded item regresses
        const selectedIds = status !== 'uploaded'
          ? s.selectedIds.filter((sid) => sid !== id)
          : s.selectedIds;
        return {
          itemMap: next,
          selectedIds,
          activePreviewIdx: clampPreviewIdx(s.activePreviewIdx, selectedIds.length),
        };
      });
    },

    _setProgress(id, pct) {
      set((s) => {
        const it = s.itemMap.get(id);
        if (!it) return {};
        const next = new Map(s.itemMap);
        next.set(id, { ...it, progress: pct });
        return { itemMap: next };
      });
    },

    _setUploaded(id, uploadedUrl) {
      set((s) => {
        const it = s.itemMap.get(id);
        if (!it) return {};
        const next = new Map(s.itemMap);
        next.set(id, {
          ...it,
          uploadedUrl,
          status: 'uploaded',
          progress: 100,
          file: null, // unblock GC — File blob is no longer needed
        });
        return { itemMap: next };
      });
    },
  };
}

/** Isolated store for tests — each call returns a fresh instance. */
export function createMediaStore(): StoreApi<MediaStoreState> {
  return create<MediaStoreState>()((set) => buildStore(set));
}

/** Module-level singleton for production use. */
export const useMediaStore = create<MediaStoreState>()((set) => buildStore(set));
