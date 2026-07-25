import { create, type StoreApi } from 'zustand';
import { MediaItem } from '../types';

export type MediaStoreState = {
  phase: 'select' | "details";
  setPhase: (phase: 'select' | 'details') => void;
  caption: string;
  setCaption: (caption: string) => void;
  isValidating: boolean;
  setIsValidating: (isValidating: boolean) => void;
  mediaList: MediaItem[];
  setMediaList: (mediaArr: MediaItem[]) => void;
  patchItem: (id: string, patch: Partial<MediaItem>) => void;
  removeItem: (id: string) => void;
  reset: () => void;
};

const DEFAULT_VALUES: Pick<MediaStoreState, 'phase' | 'mediaList' | 'caption' | 'isValidating'> = {
  phase: 'select',
  caption: '',
  mediaList: [],
  isValidating: false,
};

function buildStore(
  _set: StoreApi<MediaStoreState>['setState'],
  _get: StoreApi<MediaStoreState>['getState'],
): MediaStoreState {
  return {
    ...DEFAULT_VALUES,
    setPhase: (phase: 'select' | 'details') => {
      _set({ phase });
    },
    setCaption: (caption: string) => {
      _set({ caption });
    },
    setIsValidating: (isValidating: boolean) => {
      _set({ isValidating });
    },
    setMediaList: (mediaArr: MediaItem[]) => {
      _set({ mediaList: mediaArr });
    },
    patchItem: (id: string, patch: Partial<MediaItem>) => {
      _set((state) => {
        return {
          mediaList: state.mediaList.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        };
      });
    },
    removeItem: (id: string) => {
      const { mediaList } = _get();
      const item = mediaList.find((it) => it.id === id);

      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      _set((state) => {
        return {
          mediaList: state.mediaList.filter((item) => item.id !== id),
        };
      });
    },
    reset: () => {
      const { mediaList } = _get();
      _set(DEFAULT_VALUES);

      mediaList.forEach(
        (item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl)
      );
    }
  };
}

export function createMediaStore(): StoreApi<MediaStoreState> {
  return create<MediaStoreState>()(
    (set, get) => buildStore(set, get)
  );
}

export const useMediaStore = create<MediaStoreState>()(
  (set, get) => buildStore(set, get)
);


