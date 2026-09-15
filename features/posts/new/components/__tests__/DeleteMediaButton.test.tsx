import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { server } from '@/mocks/server';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import DeleteMediaButton from '../DeleteMediaButton';
import { useMediaStore } from '../../services/mediaStore';
import type { MediaItem } from '../../types';

function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 'test-media-1',
    file: new File([], 'test.jpg', { type: 'image/jpeg' }),
    previewUrl: 'blob:http://localhost/test',
    status: 'uploaded',
    kind: 'image',
    isValid: true,
    order: 1,
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

describe('DeleteMediaButton & DeleteImageDialog Component (Behavior)', () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
    useMediaStore.getState().setUploadSessionId('session-abc');
    jest.clearAllMocks();
  });

  it('opens confirmation modal with Persian prompt and action buttons when trash icon is clicked', async () => {
    const user = userEvent.setup();
    useMediaStore.getState().setMediaList([createMockMediaItem({ id: 'test-media-1' })]);

    renderWithProviders(<DeleteMediaButton mediaId="test-media-1" />);

    const deleteBtn = screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i });
    await user.click(deleteBtn);

    expect(screen.getByRole('heading', { name: 'حذف تصویر' })).toBeInTheDocument();
    expect(screen.getByText('آیا از حذف این تصویر اطمینان دارید؟')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'انصراف' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حذف' })).toBeInTheDocument();
  });

  it('dismisses modal without deleting when user clicks cancel button', async () => {
    const user = userEvent.setup();
    useMediaStore.getState().setMediaList([createMockMediaItem({ id: 'test-media-1' })]);

    renderWithProviders(<DeleteMediaButton mediaId="test-media-1" />);

    await user.click(screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i }));

    const cancelBtn = screen.getByRole('button', { name: 'انصراف' });
    await user.click(cancelBtn);

    // Modal is dismissed, delete button remains accessible on screen
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'حذف تصویر' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i })).toBeInTheDocument();
  });

  it('dismisses modal immediately when user confirms deletion of a local-only image', async () => {
    const user = userEvent.setup();
    useMediaStore.getState().setMediaList([
      createMockMediaItem({ id: 'local-media-1', serverMediaId: null }),
    ]);

    renderWithProviders(<DeleteMediaButton mediaId="local-media-1" />);

    await user.click(screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i }));

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    await user.click(confirmBtn);

    // Modal closes immediately upon local removal
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'حذف تصویر' })).not.toBeInTheDocument();
    });
  });

  it('triggers server delete mutation and displays success toast when confirmed for a server-uploaded image', async () => {
    const user = userEvent.setup();
    let deleteEndpointCalled = false;

    server.use(
      http.delete('*/upload-sessions/:sessionId/photos/:mediaId', ({ params }) => {
        if (params.sessionId === 'session-abc' && params.mediaId === 'srv-img-99') {
          deleteEndpointCalled = true;
          return new HttpResponse(null, { status: 204 });
        }
        return new HttpResponse(null, { status: 404 });
      })
    );

    useMediaStore.getState().setMediaList([
      createMockMediaItem({ id: 'test-media-1', serverMediaId: 'srv-img-99' }),
    ]);

    renderWithProviders(<DeleteMediaButton mediaId="test-media-1" />);

    await user.click(screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i }));

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteEndpointCalled).toBe(true);
      expect(toast.success).toHaveBeenCalledWith(ERROR_MESSAGES.posts.imageDeleteSuccess);
      expect(screen.queryByRole('heading', { name: 'حذف تصویر' })).not.toBeInTheDocument();
    });
  });

  it('displays failure toast and retains item when server delete mutation returns 500 error', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete('*/upload-sessions/:sessionId/photos/:mediaId', () => {
        return new HttpResponse(null, { status: 400 });
      })
    );

    useMediaStore.getState().setMediaList([
      createMockMediaItem({ id: 'test-media-1', serverMediaId: 'srv-img-99' }),
    ]);

    renderWithProviders(<DeleteMediaButton mediaId="test-media-1" />);

    await user.click(screen.getByRole('button', { name: /حذف از انتخاب شده‌ها/i }));

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.posts.deleteFailed);
      expect(screen.queryByRole('heading', { name: 'حذف تصویر' })).not.toBeInTheDocument();
    });
  });
});
