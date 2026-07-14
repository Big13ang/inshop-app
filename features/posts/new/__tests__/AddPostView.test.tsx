/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddPostView from '../AddPostView';
import { Toaster } from '../../../../components/ui/sonner';
import { text } from '../constants';
import { useMediaStore } from '../services/mediaStore';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { server } from '../../../../mocks/server';

// Pre-set session so the store's module-scope ensureSession() skips.
useMediaStore.setState({ uploadSessionId: 'mock-session-123', isSessionLoading: false });

// ── Global browser API stubs ──────────────────────────────────────────────────

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

beforeEach(() => {
  useMediaStore.setState({
    uploadSessionId: 'mock-session-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isSessionLoading: false,
  });
});

// Reset the media store between tests so state doesn't bleed.
afterEach(() => {
  useMediaStore.setState({
    itemMap: new Map(),
    selectedIds: [],
    activePreviewIdx: 0,
    uploadSessionId: null,
    expiresAt: null,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const setup = () => {
  const user = userEvent.setup();
  const onNavigate = jest.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const { container } = render(
    <QueryClientProvider client={client}>
      <Toaster />
      <AddPostView onNavigate={onNavigate} />
    </QueryClientProvider>
  );
  return { user, onNavigate, container };
};

const addImageFile = async (
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) => {
  const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
  const input = container.querySelector('input[multiple]') as HTMLInputElement;
  await user.upload(input, file);
};

// ── Selection phase ───────────────────────────────────────────────────────────

describe('AddPostView — selection phase', () => {
  it('renders header and footer on load', () => {
    setup();
    expect(screen.getByText(text.headerTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.nextButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.addButton })).toBeInTheDocument();
  });

  it('shows warning when Next is clicked with no uploaded images selected', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: text.nextButton }));
    await waitFor(() => {
      expect(screen.getByText(text.alertNoImages)).toBeInTheDocument();
    });
  });

  it('shows a toast for unsupported file types', async () => {
    const { user, container } = setup();
    const badFile = new File(['x'], 'photo.heic', { type: 'image/heic' });
    const input = container.querySelector('input[multiple]') as HTMLInputElement;
    await user.upload(input, badFile);
    await waitFor(() => {
      expect(screen.getByText(/JPG|PNG|WebP/)).toBeInTheDocument();
    });
  });

  it('shows a size-specific toast for oversized images, not the format error', async () => {
    const { container } = setup();
    const bigBuf = new ArrayBuffer(11 * 1024 * 1024);
    const bigFile = new File([bigBuf], 'big.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[multiple]') as HTMLInputElement;
    await userEvent.setup().upload(input, bigFile);
    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.upload.imageSizeLimit)).toBeInTheDocument();
    });
  });

  it('does nothing when the file picker change fires with no files selected', () => {
    const { container } = setup();
    const input = container.querySelector('input[multiple]') as HTMLInputElement;

    expect(() => {
      fireEvent.change(input, { target: { files: [] } });
    }).not.toThrow();

    expect(useMediaStore.getState().itemMap.size).toBe(0);
  });

  it('clicking the add button opens the native file picker', async () => {
    const { user, container } = setup();
    const input = container.querySelector('input[multiple]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await user.click(screen.getByRole('button', { name: text.addButton }));

    expect(clickSpy).toHaveBeenCalled();
  });
});

// ── Details phase ─────────────────────────────────────────────────────────────

describe('AddPostView — details phase', () => {
  async function advanceToDetails(
    user: ReturnType<typeof userEvent.setup>,
    container: HTMLElement,
  ) {
    await addImageFile(user, container);

    // Wait for the item to appear in the gallery then for the upload to finish.
    // The finalize endpoint is mocked by MSW so the item reaches 'uploaded' status.
    await screen.findByText(/1\/10 تصویر/, undefined, { timeout: 5000 });
    await waitFor(() => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((it) => it.status === 'uploaded')).toBe(true);
    }, { timeout: 5000 });

    // Click the uploaded thumbnail through the real GalleryCell onClick path.
    const thumbnail = container.querySelector('#selected-gallery-container img') as HTMLElement;
    await user.click(thumbnail);

    await user.click(screen.getByRole('button', { name: text.nextButton }));
    await screen.findByRole('textbox', { name: text.captionLabel });
  }

  it('transitions to details phase after selecting an uploaded image', async () => {
    const { user, container } = setup();
    await advanceToDetails(user, container);
    expect(screen.getByRole('textbox', { name: text.captionLabel })).toBeInTheDocument();
  });

  it('does NOT show caption error on initial render before the user has typed', async () => {
    const { user, container } = setup();
    await advanceToDetails(user, container);
    expect(screen.queryByText(text.captionError)).not.toBeInTheDocument();
  });

  it('shows validation error when caption is cleared', async () => {
    const { user, container } = setup();
    await advanceToDetails(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'تست');
    await user.clear(textarea);

    await waitFor(() => {
      expect(screen.getByText(text.captionError)).toBeInTheDocument();
    });
  });

  it('shows the admin-approval toast once all uploads complete after share', async () => {
    const { user, container } = setup();
    await advanceToDetails(user, container);

    await user.type(screen.getByRole('textbox', { name: text.captionLabel }), 'کپشن محصول نمونه');
    await user.click(screen.getByRole('button', { name: text.shareButton }));

    await waitFor(() => {
      expect(screen.getByText(text.uploadSuccessTitle)).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('shows error toast when POST /upload-sessions/publish fails', async () => {
    server.use(
      http.post('http://localhost:3000/upload-sessions/publish', () => new HttpResponse(null, { status: 500 })),
    );
    const { user, container } = setup();
    await advanceToDetails(user, container);

    await user.type(screen.getByRole('textbox', { name: text.captionLabel }), 'کپشن تست');
    await user.click(screen.getByRole('button', { name: text.shareButton }));

    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.posts.submitFailed)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('Share button is disabled and shows a spinner while the mutation is in flight', async () => {
    server.use(
      http.post('http://localhost:3000/upload-sessions/publish', () => new Promise(() => { })), // never resolves
    );
    const { user, container } = setup();
    await advanceToDetails(user, container);

    await user.type(screen.getByRole('textbox', { name: text.captionLabel }), 'کپشن تست');
    await user.click(screen.getByRole('button', { name: text.shareButton }));

    // Once isPending=true, the button text is replaced by the Loader2 SVG — use the id.
    await waitFor(() => {
      const btn = container.querySelector('#btn-share-post') as HTMLButtonElement;
      expect(btn).toBeDisabled();
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('preserves caption text and selected images after a failed submission', async () => {
    server.use(
      http.post('http://localhost:3000/upload-sessions/publish', () => new HttpResponse(null, { status: 500 })),
    );
    const { user, container } = setup();
    await advanceToDetails(user, container);

    await user.type(screen.getByRole('textbox', { name: text.captionLabel }), 'متن کپشن تست');
    await user.click(screen.getByRole('button', { name: text.shareButton }));

    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.posts.submitFailed)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Caption preserved
    expect(screen.getByRole('textbox', { name: text.captionLabel })).toHaveValue('متن کپشن تست');
    // Still on details phase — share button is still present
    expect(screen.getByRole('button', { name: text.shareButton })).toBeInTheDocument();
    // Selected images preserved — selectedIds is non-empty
    expect(useMediaStore.getState().selectedIds.length).toBeGreaterThan(0);
  });
});
