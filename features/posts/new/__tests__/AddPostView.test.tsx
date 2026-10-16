import { StrictMode } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import AddPostView from '../AddPostView';
import { useMediaStore } from '../services/mediaStore';
import { prewarmCompression, releaseIdleCompressionWorkers } from '../services/compression/compressionPool';
import { createMockFile, createMockJpegBuffer } from '../services/__tests__/fixtures/imageBuffers';

// The real pool uses import.meta/Worker, unavailable in Jest. Unsupported => original file uploads.
jest.mock('../services/compression/compressionPool', () => ({
  isCompressionSupported: jest.fn(() => false),
  compressInWorker: jest.fn(),
  prewarmCompression: jest.fn(),
  releaseIdleCompressionWorkers: jest.fn(),
}));

// compressImage logs through the Sentry-backed logger, which cannot load under jsdom.
jest.mock('@/lib/telemetry/logger', () => {
  const stub = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), forDomain: () => stub };
  return { logger: stub };
});

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

describe('AddPostView Component (Behavior)', () => {
  const originalMaxTouchPoints = navigator.maxTouchPoints;

  beforeEach(() => {
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-file');
    jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    useMediaStore.getState().reset();
    useMediaStore.getState().setUploadSessionId('mock-session-id');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints,
      configurable: true,
    });
  });

  describe('Native Platform & MIME Filters (INP-01, INP-02)', () => {
    it('constrains file picker to specific image MIME types on desktop', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      const { container } = renderWithProviders(<AddPostView />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute(
        'accept',
        'image/jpeg,image/png,image/webp'
      );
    });

    it('sets accept="image/*" on mobile to trigger the native mobile photo and camera picker', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 1,
        configurable: true,
      });

      const { container } = renderWithProviders(<AddPostView />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('File Selection & User Experience (INP-03, INP-04)', () => {
    it('triggers file picker interaction when Add button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<AddPostView />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const clickSpy = jest.spyOn(fileInput, 'click');

      const addBtn = screen.getByRole('button', { name: /اضافه کردن/ });
      await user.click(addBtn);

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('adds uploaded image to the gallery and resets input so consecutive identical files can be selected', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<AddPostView />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('valid.jpg', createMockJpegBuffer(1200, 1200));

      // Initially empty state is visible
      expect(screen.getAllByText('تصویری انتخاب نشده').length).toBeGreaterThanOrEqual(1);

      await user.upload(fileInput, validFile);

      // Input value is cleared to allow selecting the same file again
      expect(fileInput.value).toBe('');

      // User sees the new image entry in the gallery
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تصویر/ })).toBeInTheDocument();
      });
    });

    it('displays error toast feedback when user selects an invalid / corrupt image file', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<AddPostView />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const corruptFile = new File(['not an image content'], 'corrupt.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, corruptFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          ERROR_MESSAGES.upload.imageUnacceptable('corrupt.jpg'),
          expect.anything()
        );
      });
    });
  });

  describe('Compression worker prewarm', () => {
    type IdleGlobals = {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const globals = globalThis as unknown as IdleGlobals;
    const originalRic = globals.requestIdleCallback;
    const originalCic = globals.cancelIdleCallback;

    afterEach(() => {
      // Unmount while the test's idle-callback globals are still in place.
      cleanup();
      jest.useRealTimers();
      globals.requestIdleCallback = originalRic;
      globals.cancelIdleCallback = originalCic;
    });

    it('prewarms via requestIdleCallback when available', () => {
      const ric = jest.fn((cb: () => void) => {
        cb();
        return 7;
      });
      globals.requestIdleCallback = ric;
      globals.cancelIdleCallback = jest.fn();

      renderWithProviders(<AddPostView />);

      expect(ric).toHaveBeenCalledWith(prewarmCompression);
      expect(prewarmCompression).toHaveBeenCalledTimes(1);
    });

    it('falls back to a 1 s timeout without requestIdleCallback', () => {
      jest.useFakeTimers();
      globals.requestIdleCallback = undefined;

      renderWithProviders(<AddPostView />);
      expect(prewarmCompression).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(prewarmCompression).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(prewarmCompression).toHaveBeenCalledTimes(1);
    });

    it('cancels the pending prewarm and releases idle workers on unmount', () => {
      const ric = jest.fn(() => 42);
      const cic = jest.fn();
      globals.requestIdleCallback = ric;
      globals.cancelIdleCallback = cic;

      const { unmount } = renderWithProviders(<AddPostView />);
      expect(releaseIdleCompressionWorkers).not.toHaveBeenCalled();

      unmount();

      expect(cic).toHaveBeenCalledWith(42);
      expect(releaseIdleCompressionWorkers).toHaveBeenCalledTimes(1);
      expect(prewarmCompression).not.toHaveBeenCalled();
    });

    it('prewarms once under StrictMode double-mount', () => {
      jest.useFakeTimers();
      globals.requestIdleCallback = undefined;

      renderWithProviders(
        <StrictMode>
          <AddPostView />
        </StrictMode>,
      );
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(prewarmCompression).toHaveBeenCalledTimes(1);
    });
  });
});
