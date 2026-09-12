import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import DetailsPhaseFooter from '../DetailsPhaseFooter';
import { useMediaStore } from '../../services/mediaStore';
import { text } from '../../constants';
import type { MediaItem } from '../../types';

function createMockItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
    file: new File([], 'photo.jpg', { type: 'image/jpeg' }),
    previewUrl: 'blob:test',
    status: 'uploaded',
    kind: 'image',
    isValid: true,
    order: 1,
    uploadProgress: 100,
    serverMediaId: 'srv-media-1',
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

import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

describe('DetailsPhaseFooter Component (Behavior)', () => {
  beforeEach(() => {
    server.use(
      http.post('*/upload-sessions', () => {
        return HttpResponse.json({
          success: true,
          data: {
            uploadSessionId: 'mock-session-123',
            expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          },
        });
      })
    );
    jest.clearAllMocks();
    useMediaStore.getState().reset();
    useMediaStore.getState().setUploadSessionId('mock-session-123');
    useMediaStore.getState().setPhase('details');
  });

  describe('Share Button Disabled States', () => {
    it('disables the Share button when caption is empty', () => {
      useMediaStore.getState().setCaption('');
      renderWithProviders(<DetailsPhaseFooter />);

      const shareButton = screen.getByRole('button', { name: text.shareButton });
      expect(shareButton).toBeDisabled();

      const backButton = screen.getByRole('button', { name: text.previousButton });
      expect(backButton).toBeEnabled();
    });

    it('disables the Share button when caption contains only whitespace', () => {
      useMediaStore.getState().setCaption('     ');
      renderWithProviders(<DetailsPhaseFooter />);

      const shareButton = screen.getByRole('button', { name: text.shareButton });
      expect(shareButton).toBeDisabled();
    });

    it('enables the Share button when caption contains non-empty text', () => {
      useMediaStore.getState().setCaption('کفش ورزشی اصل بسیار شیک و راحت');
      renderWithProviders(<DetailsPhaseFooter />);

      const shareButton = screen.getByRole('button', { name: text.shareButton });
      expect(shareButton).toBeEnabled();
    });
  });

  describe('Pending Upload Guards', () => {
    it('warns user via toast and prevents publish when selected items are still uploading', async () => {
      const user = userEvent.setup();

      useMediaStore.getState().setCaption('کفش ورزشی مردانه با کیفیت عالی');
      useMediaStore.getState().setMediaList([
        createMockItem({
          id: 'item-1',
          status: 'uploading',
          serverMediaId: null,
          order: 1,
        }),
      ]);

      renderWithProviders(<DetailsPhaseFooter />);

      const shareButton = screen.getByRole('button', { name: text.shareButton });
      await user.click(shareButton);

      expect(toast.warning).toHaveBeenCalledWith(text.alertUploadsInProgress);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('warns user via toast when an uploaded item is missing its serverMediaId', async () => {
      const user = userEvent.setup();

      useMediaStore.getState().setCaption('محصول با کیفیت دست ساز ایرانی');
      useMediaStore.getState().setMediaList([
        createMockItem({
          id: 'item-1',
          status: 'uploaded',
          serverMediaId: null,
          order: 1,
        }),
      ]);

      renderWithProviders(<DetailsPhaseFooter />);

      const shareButton = screen.getByRole('button', { name: text.shareButton });
      await user.click(shareButton);

      expect(toast.warning).toHaveBeenCalledWith(text.alertUploadsInProgress);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Publish Flow & Navigation', () => {
    it('submits post, displays success notification, and redirects to pending page', async () => {
      const user = userEvent.setup();

      useMediaStore.getState().setCaption('کفش ورزشی راحتی مخصوص دویدن روزمره');
      useMediaStore.getState().setMediaList([
        createMockItem({
          id: 'item-1',
          status: 'uploaded',
          serverMediaId: 'media-srv-1',
          order: 1,
        }),
        createMockItem({
          id: 'item-2',
          status: 'uploaded',
          serverMediaId: 'media-srv-2',
          order: 2,
        }),
      ]);

      renderWithProviders(<DetailsPhaseFooter />);

      const shareButton = screen.getByRole('button', { name: text.shareButton });
      await user.click(shareButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(text.uploadSuccessTitle, {
          description: text.uploadSuccessDesc,
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/app/posts/pending');
    });
  });

  describe('Back Navigation', () => {
    it('returns the user to the media selection phase when previous button is clicked', async () => {
      const user = userEvent.setup();

      useMediaStore.getState().setPhase('details');
      renderWithProviders(<DetailsPhaseFooter />);

      const backButton = screen.getByRole('button', { name: text.previousButton });
      await user.click(backButton);

      expect(useMediaStore.getState().phase).toBe('select');
    });
  });
});
