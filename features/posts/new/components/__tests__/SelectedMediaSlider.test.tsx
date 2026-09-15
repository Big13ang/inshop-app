import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SelectedMediaSlider from '../SelectedMediaSlider';
import { useMediaStore } from '../../services/mediaStore';
import type { MediaItem } from '../../types';

function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `media-${Math.random().toString(36).slice(2, 9)}`,
    file: new File([], 'test.jpg', { type: 'image/jpeg' }),
    previewUrl: 'blob:http://localhost/test',
    status: 'uploaded',
    kind: 'image',
    isValid: true,
    order: null,
    uploadProgress: 100,
    serverMediaId: null,
    ...overrides,
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('SelectedMediaSlider Component (Behavior)', () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
    useMediaStore.getState().setUploadSessionId('mock-session-id');
  });

  describe('Empty State', () => {
    it('displays placeholder text when no items are selected', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-1', order: null }),
      ]);

      renderWithProviders(<SelectedMediaSlider />);

      expect(screen.getByText('تصویری انتخاب نشده')).toBeInTheDocument();
      expect(
        screen.getByText(/پس از آپلود، تصویر را لمس کنید تا به پست اضافه شود/)
      ).toBeInTheDocument();
    });
  });

  describe('Slide Counter & Ordering', () => {
    it('displays counter badge reflecting the active slide and total selected count', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-2', order: 2, previewUrl: 'blob:2' }),
        createMockMediaItem({ id: 'item-1', order: 1, previewUrl: 'blob:1' }),
      ]);

      renderWithProviders(<SelectedMediaSlider />);

      expect(screen.getByText(/فایل 1 از 2/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i })
      ).toBeInTheDocument();
    });

    it('updates counter badge to show 3 total files when 3 are selected', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-1', order: 1, previewUrl: 'blob:1' }),
        createMockMediaItem({ id: 'item-2', order: 2, previewUrl: 'blob:2' }),
        createMockMediaItem({ id: 'item-3', order: 3, previewUrl: 'blob:3' }),
      ]);

      renderWithProviders(<SelectedMediaSlider />);

      expect(screen.getByText(/فایل 1 از 3/)).toBeInTheDocument();
    });
  });

  describe('Delete Button Visibility (User Action Guard)', () => {
    it('hides delete button when only 1 image is in the carousel', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'single-item', order: 1, previewUrl: 'blob:1' }),
      ]);

      renderWithProviders(<SelectedMediaSlider />);

      expect(
        screen.queryByRole('button', { name: /حذف از انتخاب شده‌ها/i })
      ).not.toBeInTheDocument();
    });

    it('shows delete button when 2 or more images exist so user can remove surplus items', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-a', order: 1, previewUrl: 'blob:a' }),
        createMockMediaItem({ id: 'item-b', order: 2, previewUrl: 'blob:b' }),
      ]);

      renderWithProviders(<SelectedMediaSlider />);

      expect(
        screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i })
      ).toBeInTheDocument();
    });

    it('suppresses delete button in compact preview mode', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-a', order: 1, previewUrl: 'blob:a' }),
        createMockMediaItem({ id: 'item-b', order: 2, previewUrl: 'blob:b' }),
      ]);

      renderWithProviders(<SelectedMediaSlider isCompact={true} />);

      expect(
        screen.queryByRole('button', { name: /حذف از انتخاب شده‌ها/i })
      ).not.toBeInTheDocument();
    });
  });
});
