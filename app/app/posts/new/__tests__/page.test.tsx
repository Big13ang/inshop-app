/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import gsap from 'gsap';
import NewPostPage from '../page';
import { Toaster } from '@/components/ui/sonner';
import { text, MAX_IMAGES } from '@/features/posts/new/constants';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { storageKeys } from '@/lib/constants/storageKeys';
import { storage } from '@/lib/utils';
import { server } from '@/mocks/server';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockGoBackSafely = jest.fn();

jest.mock('gsap', () => ({
  killTweensOf: jest.fn(),
  context: (fn: () => void) => {
    fn();
    return { revert: jest.fn() };
  },
  fromTo: jest.fn((targets, from, to) => {
    if (to && typeof to.onComplete === 'function') {
      to.onComplete();
    }
  }),
  to: jest.fn((targets, vars) => {
    if (vars && typeof vars.onComplete === 'function') {
      vars.onComplete();
    }
  }),
  set: jest.fn(),
  ticker: { tick: jest.fn() },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => '/app/posts/new',
}));

let mockIsMobile = false;
jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    goBackSafely: (router: unknown) => mockGoBackSafely(router),
    isMobile: () => mockIsMobile,
  };
});

// Mock upload session hook for predictable test controls when needed
const mockUseUploadSession = jest.fn().mockReturnValue({ isPending: false });
jest.mock('@/features/posts/new/services/uploadSession', () => ({
  useUploadSession: () => mockUseUploadSession(),
}));

// ── Global Stubs & Setup ───────────────────────────────────────────────────────

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
  jest.clearAllMocks();
  mockIsMobile = false;
  mockUseUploadSession.mockReturnValue({ isPending: false });

  // Mark onboarding as seen by default so standard tests bypass the onboarding sheet
  storage.set(storageKeys.localStorage.posts.addPostOnboardingSeen, '1');

  useMediaStore.setState({
    itemMap: new Map(),
    selectedIds: [],
    activePreviewIdx: 0,
    uploadSessionId: 'mock-session-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
});

afterEach(() => {
  storage.remove(storageKeys.localStorage.posts.addPostOnboardingSeen);
  useMediaStore.getState().reset();
});

// ── Helper functions ───────────────────────────────────────────────────────────

const renderPage = () => {
  const user = userEvent.setup();
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const utils = render(
    <QueryClientProvider client={client}>
      <Toaster />
      <NewPostPage />
    </QueryClientProvider>,
  );

  return { user, client, ...utils };
};

const createValidJpegFile = (name = 'photo.jpg') => {
  const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xC0, 0, 0x0B, 8, 3, 0x20, 3, 0x20, 3, 0, 0, 0, 0]);
  return new File([jpegHeader], name, { type: 'image/jpeg' });
};

const uploadValidImage = async (
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  filename = 'photo.jpg',
) => {
  const file = createValidJpegFile(filename);
  const input = container.querySelector('input[multiple]') as HTMLInputElement;
  await user.upload(input, file);
};

const waitForUploadedStatus = async () => {
  await waitFor(
    () => {
      const items = [...useMediaStore.getState().itemMap.values()];
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((it) => it.status === 'uploaded')).toBe(true);
    },
    { timeout: 5000 },
  );
};

const advanceToDetailsPhase = async (
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) => {
  await uploadValidImage(user, container);
  await waitForUploadedStatus();

  // Click uploaded thumbnail to select it if not auto-selected
  const thumbnail = container.querySelector('#selected-gallery-container img') as HTMLElement;
  if (thumbnail) {
    await user.click(thumbnail);
  }

  await user.click(screen.getByRole('button', { name: text.nextButton }));
  await screen.findByRole('textbox', { name: text.captionLabel });
};

// ── Test Suites ────────────────────────────────────────────────────────────────

describe('/app/posts/new — Page & Session Initialization', () => {
  it('renders page header title and action buttons on mount', () => {
    renderPage();
    expect(screen.getByText(text.headerTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.nextButton })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.addButton })).toBeInTheDocument();
  });

  it('displays loading skeleton when upload session is loading', () => {
    mockUseUploadSession.mockReturnValue({ isPending: true });
    renderPage();

    expect(screen.getByRole('button', { name: text.nextButton })).toBeDisabled();
    expect(screen.getByRole('button', { name: text.addButton })).toBeDisabled();
  });

  it('resets draft session when page unmounts', () => {
    const { client, unmount } = renderPage();

    act(() => {
      useMediaStore.getState().setUploadSession('session-to-clear', '2026-07-21T00:00:00Z');
    });

    unmount();

    expect(useMediaStore.getState().uploadSessionId).toBeNull();
  });

  it('header back button in select phase triggers safe back navigation', async () => {
    const { user, container } = renderPage();
    const backBtn = container.querySelector('#add-post-back-btn') as HTMLButtonElement;

    await user.click(backBtn);

    expect(mockGoBackSafely).toHaveBeenCalled();
  });

  it('header back button triggers safe back navigation in details phase', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const backBtn = container.querySelector('#add-post-back-btn') as HTMLButtonElement;
    await user.click(backBtn);

    expect(mockGoBackSafely).toHaveBeenCalled();
  });
});

describe('/app/posts/new — First-Time Onboarding Drawer', () => {
  it('shows onboarding drawer when user has not seen onboarding yet', () => {
    storage.remove(storageKeys.localStorage.posts.addPostOnboardingSeen);
    renderPage();

    expect(screen.getByText('فروشنده گرامی، خوش آمدید.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'متوجه شدم' })).toBeInTheDocument();
  });

  it('closes onboarding drawer and persists flag when user clicks "متوجه شدم"', () => {
    storage.remove(storageKeys.localStorage.posts.addPostOnboardingSeen);
    renderPage();

    const gotItBtn = screen.getByRole('button', { name: 'متوجه شدم' });

    jest.useFakeTimers();
    act(() => {
      fireEvent.click(gotItBtn);
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    jest.useRealTimers();

    expect(screen.queryByText('فروشنده گرامی، خوش آمدید.')).not.toBeInTheDocument();

    const storedVal = storage.get(storageKeys.localStorage.posts.addPostOnboardingSeen);
    expect(storedVal.ok && storedVal.value === '1').toBe(true);
  });

  it('does not display onboarding drawer if flag is already set in localStorage', () => {
    storage.set(storageKeys.localStorage.posts.addPostOnboardingSeen, '1');
    renderPage();

    expect(screen.queryByText('فروشنده گرامی، خوش آمدید.')).not.toBeInTheDocument();
  });
});

describe('/app/posts/new — File Selection & Input Validation', () => {
  it('sets file accept attribute to image/* on mobile devices', () => {
    mockIsMobile = true;
    const { container } = renderPage();

    const input = container.querySelector('input[multiple]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  it('sets file accept attribute to specific image formats on desktop', () => {
    mockIsMobile = false;
    const { container } = renderPage();

    const input = container.querySelector('input[multiple]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  it('clicking "اضافه کردن" button triggers file input click', async () => {
    const { user, container } = renderPage();
    const input = container.querySelector('input[multiple]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await user.click(screen.getByRole('button', { name: text.addButton }));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows warning toast when an invalid format image is uploaded', async () => {
    const { user, container } = renderPage();
    const badFile = new File(['invalid content'], 'photo.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[multiple]') as HTMLInputElement;

    await user.upload(input, badFile);

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        text.alertInvalidImageFormat,
        expect.objectContaining({ position: 'top-center' }),
      );
    });
  });

  it('shows warning toast when an oversized image (>10MB) is uploaded', async () => {
    const { user, container } = renderPage();
    const oversizedBuffer = new ArrayBuffer(11 * 1024 * 1024);
    const oversizedFile = new File([oversizedBuffer], 'big.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[multiple]') as HTMLInputElement;

    await user.upload(input, oversizedFile);

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.imageSizeLimit,
        expect.objectContaining({ position: 'top-center' }),
      );
    });
  });

  it('does nothing when file input change fires with empty files array', () => {
    const { container } = renderPage();
    const input = container.querySelector('input[multiple]') as HTMLInputElement;

    expect(() => {
      fireEvent.change(input, { target: { files: [] } });
    }).not.toThrow();

    expect(useMediaStore.getState().itemMap.size).toBe(0);
  });

  it('disables "اضافه کردن" button when maximum image limit (10) is reached', () => {
    const itemMap = new Map();
    for (let i = 0; i < MAX_IMAGES; i++) {
      itemMap.set(`img-${i}`, {
        id: `img-${i}`,
        file: createValidJpegFile(`img-${i}.jpg`),
        localUrl: `blob:img-${i}`,
        uploadedUrl: `http://localhost:9000/img-${i}.jpg`,
        mediaKind: 'image',
        status: 'uploaded',
        progress: 100,
        retries: 0,
      });
    }

    useMediaStore.setState({
      itemMap,
      selectedIds: Array.from(itemMap.keys()),
    });

    renderPage();

    expect(screen.getByRole('button', { name: text.addButton })).toBeDisabled();
    expect(screen.getByText(`${MAX_IMAGES}/${MAX_IMAGES} تصویر`)).toBeInTheDocument();
  });
});

describe('/app/posts/new — Upload Queue & Statuses', () => {
  it('disables next button and shows loading spinner when image upload is in progress', async () => {
    useMediaStore.setState({
      itemMap: new Map([
        [
          'uploading-1',
          {
            id: 'uploading-1',
            file: createValidJpegFile('uploading.jpg'),
            localUrl: 'blob:uploading',
            mediaKind: 'image',
            status: 'uploading',
            progress: 45,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['uploading-1'],
    });

    const { container } = renderPage();
    const nextBtn = container.querySelector('#btn-next-step') as HTMLButtonElement;

    expect(nextBtn).toBeDisabled();
    expect(nextBtn.querySelector('svg')).toBeInTheDocument();
  });

  it('shows warning toast if share is clicked while selected upload is in progress in details phase', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'کپشن در حال آپلود');

    act(() => {
      useMediaStore.setState((s) => {
        const newMap = new Map(s.itemMap);
        const firstId = s.selectedIds[0];
        if (firstId && newMap.has(firstId)) {
          newMap.set(firstId, {
            ...newMap.get(firstId)!,
            status: 'uploading',
          });
        }
        return { itemMap: newMap };
      });
    });

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    await user.click(shareBtn);

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(text.alertUploadsInProgress);
    });
  });

  it('renders failure state and retries upload on user interaction', async () => {
    useMediaStore.setState({
      itemMap: new Map([
        [
          'failed-1',
          {
            id: 'failed-1',
            file: createValidJpegFile('failed.jpg'),
            localUrl: 'blob:failed',
            mediaKind: 'image',
            status: 'failed',
            progress: 0,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['failed-1'],
    });

    const { user, container } = renderPage();

    expect(screen.getByText(text.statusFailed)).toBeInTheDocument();

    const cell = container.querySelector('[data-status="failed"]') as HTMLElement;
    if (cell) {
      await user.click(cell);
    }

    // Retrying moves status from failed back to queued/uploading
    await waitFor(() => {
      const item = useMediaStore.getState().itemMap.get('failed-1');
      expect(item?.status).not.toBe('failed');
    });
  });
});

describe('/app/posts/new — Selected Gallery & Media Slider', () => {
  it('displays empty gallery state when no images are selected', () => {
    renderPage();
    expect(screen.getAllByText('تصویری انتخاب نشده').length).toBeGreaterThan(0);
    expect(screen.getByText('با دکمه «اضافه کردن» در پایین صفحه تصاویر خود را وارد کنید')).toBeInTheDocument();
  });

  it('toggles image selection when clicking uploaded gallery thumbnail', async () => {
    useMediaStore.setState({
      itemMap: new Map([
        [
          'img-1',
          {
            id: 'img-1',
            file: createValidJpegFile('img-1.jpg'),
            localUrl: 'blob:img-1',
            uploadedUrl: 'http://localhost:9000/img-1.jpg',
            mediaKind: 'image',
            status: 'uploaded',
            progress: 100,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['img-1'],
    });

    const { user, container } = renderPage();

    const cell = container.querySelector('[data-status="uploaded"]') as HTMLElement;
    await user.click(cell);

    expect(useMediaStore.getState().selectedIds).not.toContain('img-1');

    await user.click(cell);
    expect(useMediaStore.getState().selectedIds).toContain('img-1');
  });

  it('renders slider active index indicator when images are selected', () => {
    useMediaStore.setState({
      itemMap: new Map([
        [
          'img-1',
          {
            id: 'img-1',
            file: createValidJpegFile('img-1.jpg'),
            localUrl: 'blob:img-1',
            uploadedUrl: 'http://localhost:9000/img-1.jpg',
            mediaKind: 'image',
            status: 'uploaded',
            progress: 100,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['img-1'],
      activePreviewIdx: 0,
    });

    renderPage();

    expect(screen.getByText('فایل 1 از 1')).toBeInTheDocument();
  });

  it('removes image from selection when clicking slider trash button (when >1 image selected)', async () => {
    useMediaStore.setState({
      itemMap: new Map([
        [
          'img-1',
          {
            id: 'img-1',
            file: createValidJpegFile('img-1.jpg'),
            localUrl: 'blob:img-1',
            uploadedUrl: 'http://localhost:9000/img-1.jpg',
            mediaKind: 'image',
            status: 'uploaded',
            progress: 100,
            retries: 0,
          },
        ],
        [
          'img-2',
          {
            id: 'img-2',
            file: createValidJpegFile('img-2.jpg'),
            localUrl: 'blob:img-2',
            uploadedUrl: 'http://localhost:9000/img-2.jpg',
            mediaKind: 'image',
            status: 'uploaded',
            progress: 100,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['img-1', 'img-2'],
      activePreviewIdx: 0,
    });

    const { user } = renderPage();

    const trashBtn = screen.getByTitle('حذف از انتخاب شده‌ها');
    await user.click(trashBtn);

    expect(useMediaStore.getState().selectedIds).toEqual(['img-2']);
  });

  it('opens DeleteImageDialog on long press and confirms deletion', () => {
    jest.useFakeTimers();

    useMediaStore.setState({
      itemMap: new Map([
        [
          'img-del',
          {
            id: 'img-del',
            file: createValidJpegFile('img-del.jpg'),
            localUrl: 'blob:img-del',
            uploadedUrl: 'http://localhost:9000/img-del.jpg',
            mediaKind: 'image',
            status: 'uploaded',
            progress: 100,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['img-del'],
    });

    const { container } = renderPage();

    const cell = container.querySelector('[data-status="uploaded"]') as HTMLElement;
    fireEvent.mouseDown(cell, { button: 0 });

    act(() => {
      jest.advanceTimersByTime(700);
    });

    fireEvent.mouseUp(cell);

    expect(screen.getByText('حذف تصویر')).toBeInTheDocument();
    expect(screen.getByText('آیا از حذف این تصویر اطمینان دارید؟')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    act(() => {
      fireEvent.click(confirmBtn);
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    jest.useRealTimers();

    expect(useMediaStore.getState().itemMap.has('img-del')).toBe(false);
  });

  it('cancels DeleteImageDialog without removing image', () => {
    jest.useFakeTimers();

    useMediaStore.setState({
      itemMap: new Map([
        [
          'img-keep',
          {
            id: 'img-keep',
            file: createValidJpegFile('img-keep.jpg'),
            localUrl: 'blob:img-keep',
            uploadedUrl: 'http://localhost:9000/img-keep.jpg',
            mediaKind: 'image',
            status: 'uploaded',
            progress: 100,
            retries: 0,
          },
        ],
      ]),
      selectedIds: ['img-keep'],
    });

    const { container } = renderPage();

    const cell = container.querySelector('[data-status="uploaded"]') as HTMLElement;
    fireEvent.mouseDown(cell, { button: 0 });

    act(() => {
      jest.advanceTimersByTime(700);
    });

    fireEvent.mouseUp(cell);

    expect(screen.getByText('حذف تصویر')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'انصراف' });
    act(() => {
      fireEvent.click(cancelBtn);
    });
    jest.useRealTimers();

    expect(screen.queryByText('حذف تصویر')).not.toBeInTheDocument();
    expect(useMediaStore.getState().itemMap.has('img-keep')).toBe(true);
  });
});

describe('/app/posts/new — Phase Navigation & Form Validation', () => {
  it('shows warning toast when clicking Next with 0 images selected', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: text.nextButton }));

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(text.alertNoImages);
    });
  });

  it('transitions to details phase when clicking Next with uploaded image selected', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    expect(screen.getByRole('textbox', { name: text.captionLabel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: text.shareButton })).toBeInTheDocument();
  });

  it('does not show caption error on initial transition to details phase', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    expect(screen.queryByText(text.captionError)).not.toBeInTheDocument();
  });

  it('shows validation error when caption is entered and then cleared', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'کپشن اول');
    await user.clear(textarea);

    await waitFor(() => {
      expect(screen.getByText(text.captionError)).toBeInTheDocument();
    });
  });

  it('Share button is disabled when caption is empty or contains only whitespace', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    expect(shareBtn).toBeDisabled();

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, '   ');

    expect(shareBtn).toBeDisabled();
  });
});

describe('/app/posts/new — Post Submission & Network Interactions', () => {
  it('submits post payload and handles successful post publication', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'تست کپشن محصول جدید');

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    await user.click(shareBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        text.uploadSuccessTitle,
        expect.objectContaining({ description: text.uploadSuccessDesc }),
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/app/posts/pending');
  });

  it('shows error toast when publish endpoint responds with 500 error', async () => {
    server.use(
      http.post('http://localhost:3000/upload-sessions/publish', () => new HttpResponse(null, { status: 500 })),
    );

    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'کپشن همراه خطا');

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    await user.click(shareBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.posts.submitFailed);
    });
  });

  it('shows loading spinner on Share button during submission in flight', async () => {
    server.use(
      http.post('http://localhost:3000/upload-sessions/publish', () => new Promise(() => {})),
    );

    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'کپشن در حال ارسال');

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    await user.click(shareBtn);

    await waitFor(() => {
      expect(shareBtn).toBeDisabled();
      expect(shareBtn.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('preserves caption text and selected images on submit failure allowing retry', async () => {
    server.use(
      http.post('http://localhost:3000/upload-sessions/publish', () => new HttpResponse(null, { status: 500 })),
    );

    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'کپشن محفوظ شده');

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    await user.click(shareBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.posts.submitFailed);
    });

    expect(screen.getByRole('textbox', { name: text.captionLabel })).toHaveValue('کپشن محفوظ شده');
    expect(screen.getByRole('button', { name: text.shareButton })).toBeInTheDocument();
    expect(useMediaStore.getState().selectedIds.length).toBeGreaterThan(0);
  });
});
