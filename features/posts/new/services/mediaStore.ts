import { create, type StoreApi } from 'zustand';
import { type MediaItem, type MediaStatus } from '../types';
import { http } from '@/lib/utils';

// ── State shape ───────────────────────────────────────────────────────────────

export interface MediaStoreState {
  /** O(1) lookup by ID. Insertion order is preserved by Map. */
  itemMap: Map<string, MediaItem>;
  /** Ordered IDs of *uploaded* items added to the post. */
  selectedIds: string[];
  activePreviewIdx: number;
  uploadSessionId: string | null;
  expiresAt: string | null;
  isSessionLoading: boolean;

  // ── Public actions ──────────────────────────────────────────────────────────
  /** Appends items — never replaces existing ones. */
  addItems(items: MediaItem[]): void;
  /** Removes the item and revokes its blob URL. */
  removeItem(id: string): void;
  /** Toggles selection — only works when item.status === 'uploaded'. */
  toggleSelected(id: string): void;
  setUploadSession(id: string, expiresAt: string): void;
  ensureSession(): void;
  reset(): void;

  // ── Internal actions (called by upload callbacks) ───────────────────────────
  _setStatus(id: string, status: MediaStatus): void;
  _setProgress(id: string, pct: number): void;
  /** Called on upload success — sets URL, nulls file ref, marks uploaded. */
  _setUploaded(id: string, uploadedUrl: string): void;
}

// ── Helper functions for immutable updates and side effects ──────────────────

function clampPreviewIdx(idx: number, selectedCount: number): number {
  return Math.min(idx, Math.max(0, selectedCount - 1));
}

/**
 * Updates a MediaItem in a Map, returning a new Map.
 * Returns null if the item doesn't exist.
 */
function updateItemInMap(
  map: Map<string, MediaItem>,
  id: string,
  updater: (item: MediaItem) => Partial<MediaItem>,
): Map<string, MediaItem> | null {
  const item = map.get(id);
  if (!item) return null;
  const next = new Map(map);
  next.set(id, { ...item, ...updater(item) });
  return next;
}

// ── Store factory (enables test isolation) ────────────────────────────────────

function buildStore(
  set: StoreApi<MediaStoreState>['setState'],
  get: StoreApi<MediaStoreState>['getState'],
): MediaStoreState {
  return {
    itemMap: new Map(),
    selectedIds: [],
    activePreviewIdx: 0,
    uploadSessionId: null,
    expiresAt: null,
    isSessionLoading: false,

    addItems(items) {
      set((s) => {
        const next = new Map(s.itemMap);
        for (const item of items) {
          next.set(item.id, item);
        }
        return { itemMap: next };
      });
    },

    removeItem(id) {
      // Perform URL revocation side effect outside state updater
      const item = get().itemMap.get(id);
      if (item?.localUrl) {
        try {
          URL.revokeObjectURL(item.localUrl);
        } catch {
          // ignore
        }
      }

      set((s) => {
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
        const item = s.itemMap.get(id);
        if (!item || item.status !== 'uploaded') return {};

        const alreadySelected = s.selectedIds.includes(id);
        const selectedIds = alreadySelected
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
        const nextMap = updateItemInMap(s.itemMap, id, () => ({ status }));
        if (!nextMap) return {};

        const selectedIds = status !== 'uploaded'
          ? s.selectedIds.filter((sid) => sid !== id)
          : s.selectedIds;

        return {
          itemMap: nextMap,
          selectedIds,
          activePreviewIdx: clampPreviewIdx(s.activePreviewIdx, selectedIds.length),
        };
      });
    },

    _setProgress(id, pct) {
      set((s) => {
        const nextMap = updateItemInMap(s.itemMap, id, () => ({ progress: pct }));
        if (!nextMap) return {};
        return { itemMap: nextMap };
      });
    },

    _setUploaded(id, uploadedUrl) {
      set((s) => {
        const nextMap = updateItemInMap(s.itemMap, id, () => ({
          uploadedUrl,
          status: 'uploaded',
          progress: 100,
          file: null, // unblock GC — File blob is no longer needed
        }));
        if (!nextMap) return {};
        return { itemMap: nextMap };
      });
    },

    setUploadSession(id, expiresAt) {
      set({ uploadSessionId: id, expiresAt });
    },

    ensureSession() {
      const current = get();
      if (current.uploadSessionId || current.isSessionLoading) return;

      set({ isSessionLoading: true });
      http
        .post<{ uploadSessionId: string; expiresAt: string }>(
          '/upload-sessions',
        )
        .then((res) => {
          if (res.ok) {
            get().setUploadSession(
              res.value.uploadSessionId,
              res.value.expiresAt,
            );
          }
        })
        .finally(() => {
          set({ isSessionLoading: false });
        });
    },

    reset() {
      // Revoke all local URLs outside state updater
      for (const item of get().itemMap.values()) {
        if (item.localUrl) {
          try {
            URL.revokeObjectURL(item.localUrl);
          } catch {
            // ignore
          }
        }
      }

      set({
        itemMap: new Map(),
        selectedIds: [],
        activePreviewIdx: 0,
        uploadSessionId: null,
        expiresAt: null,
        isSessionLoading: false,
      });

      get().ensureSession();
    },
  };
}

/** Isolated store for tests — each call returns a fresh instance. */
export function createMediaStore(): StoreApi<MediaStoreState> {
  return create<MediaStoreState>()((set, get) => buildStore(set, get));
}

/** Module-level singleton for production use. */
export const useMediaStore = create<MediaStoreState>()((set, get) => buildStore(set, get));

// Auto-fetch session when store initializes without one.
const initialState = useMediaStore.getState();
if (!initialState.uploadSessionId) {
  initialState.ensureSession();
}
