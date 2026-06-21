import { renderHook, act } from '@testing-library/react';
import { usePostFlow } from '../hooks/usePostFlow';
import { useMediaStore } from '../services/mediaStore';
import type { MediaStatus, MediaKind } from '../types';

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockMutate = jest.fn();
let capturedOnSuccess: (() => void) | undefined;

jest.mock('../hooks/useMediaUpload', () => ({
  useMediaUpload: () => ({
    addFiles: jest.fn(),
    cancelUpload: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

jest.mock('../hooks/useSubmitPost', () => ({
  useSubmitPost: (onSuccess: () => void) => {
    capturedOnSuccess = onSuccess;
    return {
      mutate: mockMutate,
      isPending: false,
    };
  },
}));

jest.mock('sonner', () => ({
  toast: { warning: jest.fn(), error: jest.fn(), success: jest.fn() },
}));

import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(id: string, uploadedUrl?: string) {
  return {
    id,
    name: `${id}.jpg`,
    file: uploadedUrl ? null : new File(['x'], `${id}.jpg`),
    localUrl: 'blob:local',
    status: (uploadedUrl ? 'uploaded' : 'uploading') as MediaStatus,
    progress: uploadedUrl ? 100 : 50,
    mediaKind: 'image' as MediaKind,
    uploadedUrl,
  };
}

function setupStore(ids: string[], items: ReturnType<typeof makeItem>[]) {
  act(() => {
    useMediaStore.setState({
      itemMap: new Map(items.map((it) => [it.id, it])),
      selectedIds: ids,
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useMediaStore.setState({ itemMap: new Map(), selectedIds: [], activePreviewIdx: 0 });
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePostFlow — handleNext', () => {

  describe('select phase', () => {
    it('warns and does not advance when no items are selected', () => {
      const { result } = renderHook(() => usePostFlow(jest.fn()));
      setupStore([], []);

      act(() => { result.current.handleNext(); });

      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(result.current.phase).toBe('select');
    });

    it('advances to details when at least one item is selected', () => {
      const { result } = renderHook(() => usePostFlow(jest.fn()));
      setupStore(['a'], [makeItem('a', 'https://cdn/a.jpg')]);

      act(() => { result.current.handleNext(); });

      expect(result.current.phase).toBe('details');
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('details phase', () => {
    function advanceToDetails(caption = 'test caption') {
      const onNavigate = jest.fn();
      const { result } = renderHook(() => usePostFlow(onNavigate));

      setupStore(['a'], [makeItem('a', 'https://cdn/a.jpg')]);
      act(() => { result.current.handleNext(); }); // select → details
      act(() => { result.current.setCaption(caption); });

      return { result, onNavigate };
    }

    it('warns and does not submit when caption is empty', () => {
      const { result } = advanceToDetails('');
      act(() => { result.current.setCaption(''); });
      act(() => { result.current.handleNext(); });

      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('submits with all uploadedUrls when every selected item is uploaded', () => {
      const { result } = advanceToDetails('my caption');

      setupStore(
        ['a', 'b'],
        [makeItem('a', 'https://cdn/a.jpg'), makeItem('b', 'https://cdn/b.jpg')],
      );

      act(() => { result.current.handleNext(); });

      expect(mockMutate).toHaveBeenCalledWith({
        caption: 'my caption',
        mediaUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
      });
    });

    it('warns and does NOT submit when some selected items are still uploading', () => {
      const { result } = advanceToDetails('my caption');

      // 'a' is uploaded, 'b' is still uploading (no uploadedUrl)
      setupStore(
        ['a', 'b'],
        [makeItem('a', 'https://cdn/a.jpg'), makeItem('b')],
      );

      act(() => { result.current.handleNext(); });

      expect(mockMutate).not.toHaveBeenCalled();
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('warns and does NOT submit when ALL selected items are still uploading', () => {
      const { result } = advanceToDetails('my caption');

      setupStore(['a', 'b'], [makeItem('a'), makeItem('b')]);

      act(() => { result.current.handleNext(); });

      expect(mockMutate).not.toHaveBeenCalled();
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleBack', () => {
    it('sets phase to select when in details phase', () => {
      const { result } = renderHook(() => usePostFlow(jest.fn()));
      setupStore(['a'], [makeItem('a', 'https://cdn/a.jpg')]);

      // Move to details phase first
      act(() => { result.current.handleNext(); });
      expect(result.current.phase).toBe('details');

      // Go back
      act(() => { result.current.handleBack(); });
      expect(result.current.phase).toBe('select');
    });

    it('navigates back when in select phase', () => {
      const onNavigate = jest.fn();
      const { result } = renderHook(() => usePostFlow(onNavigate));

      act(() => { result.current.handleBack(); });
      expect(onNavigate).toHaveBeenCalledWith('back');
    });
  });

  describe('handleNext with pending uploads', () => {
    it('warns and does not advance to details when uploads are pending', () => {
      const { result } = renderHook(() => usePostFlow(jest.fn()));
      setupStore([], [makeItem('a')]); // uploads pending

      act(() => { result.current.handleNext(); });

      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(result.current.phase).toBe('select');
    });
  });

  describe('submission success', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    it('shows a success toast and navigates only after 30s', () => {
      const onNavigate = jest.fn();
      renderHook(() => usePostFlow(onNavigate));

      act(() => { capturedOnSuccess?.(); });

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ duration: 30000 }),
      );
      expect(onNavigate).not.toHaveBeenCalled();

      act(() => { jest.advanceTimersByTime(29999); });
      expect(onNavigate).not.toHaveBeenCalled();

      act(() => { jest.advanceTimersByTime(1); });
      expect(onNavigate).toHaveBeenCalledWith('pending-posts');
    });

    it('does not navigate after the hook has unmounted', () => {
      const onNavigate = jest.fn();
      const { unmount } = renderHook(() => usePostFlow(onNavigate));

      act(() => { capturedOnSuccess?.(); });
      unmount();

      act(() => { jest.advanceTimersByTime(30000); });
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});

