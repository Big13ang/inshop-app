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

jest.mock('@/lib/utils', () => ({
  http: {
    post: jest.fn().mockResolvedValue({
      ok: true,
      value: { data: { uploadSessionId: 'mock-session-123', expiresAt: '2026-07-14T00:00:00Z' } },
    }),
  },
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  formatToUUID: (hex: string) => {
    if (hex && hex.length === 32 && !hex.includes('-')) {
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    return hex;
  },
}));

jest.mock('../../services/postsQueryService', () => ({
  postsQueryService: {
    useSubmitPost: (onSuccess: () => void) => {
      capturedOnSuccess = onSuccess;
      return {
        mutate: mockMutate,
        isPending: false,
      };
    },
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

function setupStore(ids: string[], items: ReturnType<typeof makeItem>[], sessionId: string | null = 'mock-session-123') {
  act(() => {
    useMediaStore.setState({
      itemMap: new Map(items.map((it) => [it.id, it])),
      selectedIds: ids,
      uploadSessionId: sessionId,
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useMediaStore.setState({
      itemMap: new Map(),
      selectedIds: [],
      activePreviewIdx: 0,
      uploadSessionId: 'mock-session-123',
      expiresAt: null,
      isSessionLoading: false,
    });
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

    it('submits with description and mediaIds when every selected item is uploaded', () => {
      const { result } = advanceToDetails('my caption');

      setupStore(
        ['a', 'b'],
        [makeItem('a', 'https://cdn/a'), makeItem('b', 'https://cdn/b')],
        'mock-session-123',
      );

      act(() => { result.current.handleNext(); });

      expect(mockMutate).toHaveBeenCalledWith({
        uploadSessionId: 'mock-session-123',
        description: 'my caption',
        mediaIds: ['a', 'b'],
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
    it('shows a success toast, resets the state and mediaStore, and navigates immediately', async () => {
      const onNavigate = jest.fn();

      // Set some initial state to verify it gets reset
      setupStore(['a'], [makeItem('a', 'https://cdn/a.jpg')]);

      const { result } = renderHook(() => usePostFlow(onNavigate));

      // Move to details and set caption to dirty the local states
      act(() => { result.current.handleNext(); }); // select -> details
      act(() => { result.current.setCaption('some text'); });

      expect(result.current.phase).toBe('details');
      expect(result.current.caption).toBe('some text');
      expect(useMediaStore.getState().selectedIds).toEqual(['a']);
      expect(useMediaStore.getState().itemMap.size).toBe(1);

      await act(async () => {
        capturedOnSuccess?.();
        // Allow microtasks/promises to resolve
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: expect.any(String) }),
      );
      expect(onNavigate).toHaveBeenCalledWith('pending-posts');

      // Verify local states are reset
      expect(result.current.phase).toBe('select');
      expect(result.current.caption).toBe('');

      // Verify mediaStore is reset
      expect(useMediaStore.getState().selectedIds).toEqual([]);
      expect(useMediaStore.getState().itemMap.size).toBe(0);
    });
  });
});

