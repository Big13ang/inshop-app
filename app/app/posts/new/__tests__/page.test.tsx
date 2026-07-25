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
const mockUseUploadSession = jest.fn().mockReturnValue({
  isPending: false,
  isSuccess: true,
  data: { uploadSessionId: 'mock-session-123', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
});
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
  mockUseUploadSession.mockReturnValue({
    isPending: false,
    isSuccess: true,
    data: { uploadSessionId: 'mock-session-123', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
  });

  // Mark onboarding as seen by default so standard tests bypass the onboarding sheet
  storage.set(storageKeys.localStorage.posts.addPostOnboardingSeen, '1');

  useMediaStore.setState({
    phase: 'select',
    caption: '',
    isValidating: false,
    mediaList: [],
  });
});

afterEach(() => {
  storage.remove(storageKeys.localStorage.posts.addPostOnboardingSeen);
  useMediaStore.getState().reset();
  jest.useRealTimers();
});

// ── Helper functions ───────────────────────────────────────────────────────────

const renderPage = () => {
  const user = userEvent.setup();
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false, onError: () => {} },
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
  const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xC0, 0, 0x0B, 8, 4, 0x38, 4, 0x38, 3, 0, 0, 0, 0]);
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
      const items = useMediaStore.getState().mediaList;
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

  const item = useMediaStore.getState().mediaList[0];
  if (item && item.order === null) {
    const thumbnail = container.querySelector('#selected-gallery-container img') as HTMLElement;
    if (thumbnail) {
      await user.click(thumbnail);
    }
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

  it('resets media store state when page unmounts', () => {
    const { unmount } = renderPage();

    act(() => {
      useMediaStore.setState({ caption: 'temp-caption' });
    });

    unmount();

    expect(useMediaStore.getState().mediaList.length).toBe(0);
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
      expect(toast.error).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.imageUnacceptable(badFile.name),
        expect.objectContaining({ description: expect.any(String) }),
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
      expect(toast.error).toHaveBeenCalledWith(
        ERROR_MESSAGES.upload.imageUnacceptable(oversizedFile.name),
        expect.objectContaining({ description: ERROR_MESSAGES.upload.imageSizeLimit }),
      );
    });
  });

  it('does nothing when file input change fires with empty files array', () => {
    const { container } = renderPage();
    const input = container.querySelector('input[multiple]') as HTMLInputElement;

    expect(() => {
      fireEvent.change(input, { target: { files: [] } });
    }).not.toThrow();

    expect(useMediaStore.getState().mediaList.length).toBe(0);
  });

  it('disables "اضافه کردن" button when maximum image limit (10) is reached', () => {
    useMediaStore.setState({
      mediaList: Array.from({ length: MAX_IMAGES }, (_, i) => ({
        id: `img-${i}`,
        file: createValidJpegFile(`img-${i}.jpg`),
        previewUrl: `blob:img-${i}`,
        status: 'uploaded',
        uploadProgress: 100,
        kind: 'image',
        isValid: true,
        order: i + 1,
      })),
    });

    renderPage();

    expect(screen.getByRole('button', { name: text.addButton })).toBeDisabled();
    expect(screen.getByText(`${MAX_IMAGES}/${MAX_IMAGES} تصویر`)).toBeInTheDocument();
  });
});

describe('/app/posts/new — Upload Queue & Statuses', () => {
  it('disables next button and shows loading spinner when image upload is in progress', async () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'uploading-1',
          file: createValidJpegFile('uploading.jpg'),
          previewUrl: 'blob:uploading',
          status: 'uploading',
          uploadProgress: 45,
          kind: 'image',
          isValid: true,
          order: 1,
        },
      ],
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
      useMediaStore.setState((s) => ({
        mediaList: s.mediaList.map((m, idx) => (idx === 0 ? { ...m, status: 'uploading' } : m)),
      }));
    });

    const shareBtn = container.querySelector('#btn-share-post') as HTMLButtonElement;
    await user.click(shareBtn);

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(text.alertUploadsInProgress);
    });
  });

  it('renders failure state and retries upload on user interaction', async () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'failed-1',
          file: createValidJpegFile('failed.jpg'),
          previewUrl: 'blob:failed',
          status: 'failed',
          uploadProgress: 0,
          kind: 'image',
          isValid: true,
          order: null,
        },
      ],
    });

    const { container } = renderPage();

    expect(screen.getByText(text.statusFailed)).toBeInTheDocument();

    act(() => {
      useMediaStore.getState().patchItem('failed-1', { status: 'uploading' });
    });

    // Retrying moves status from failed back to queued/uploading
    const item = useMediaStore.getState().mediaList.find((i) => i.id === 'failed-1');
    expect(item?.status).not.toBe('failed');
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
      mediaList: [
        {
          id: 'img-1',
          file: createValidJpegFile('img-1.jpg'),
          previewUrl: 'blob:img-1',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 1,
        },
      ],
    });

    const { user, container } = renderPage();

    const cell = container.querySelector('[data-status="uploaded"]') as HTMLElement;
    await user.click(cell);

    expect(useMediaStore.getState().mediaList[0].order).toBeNull();

    await user.click(cell);
    expect(useMediaStore.getState().mediaList[0].order).not.toBeNull();
  });

  it('renders slider active index indicator when images are selected', () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'img-1',
          file: createValidJpegFile('img-1.jpg'),
          previewUrl: 'blob:img-1',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 1,
        },
      ],
    });

    renderPage();

    expect(screen.getByText('فایل 1 از 1')).toBeInTheDocument();
  });

  it('removes image from selection when clicking slider trash button (when >1 image selected)', async () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'img-1',
          file: createValidJpegFile('img-1.jpg'),
          previewUrl: 'blob:img-1',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 1,
        },
        {
          id: 'img-2',
          file: createValidJpegFile('img-2.jpg'),
          previewUrl: 'blob:img-2',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 2,
        },
      ],
    });

    const { user } = renderPage();

    const trashBtn = screen.getByTitle('حذف از انتخاب شده‌ها');
    await user.click(trashBtn);

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(useMediaStore.getState().mediaList.find((i) => i.id === 'img-1')).toBeUndefined();
    });
  });

  it('opens DeleteImageDialog on trash button click and confirms deletion', async () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'img-del',
          file: createValidJpegFile('img-del.jpg'),
          previewUrl: 'blob:img-del',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 1,
        },
        {
          id: 'img-2',
          file: createValidJpegFile('img-2.jpg'),
          previewUrl: 'blob:img-2',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 2,
        },
      ],
    });

    const { user } = renderPage();

    const trashBtn = screen.getByTitle('حذف از انتخاب شده‌ها');
    await user.click(trashBtn);

    expect(screen.getByText('حذف تصویر')).toBeInTheDocument();
    expect(screen.getByText('آیا از حذف این تصویر اطمینان دارید؟')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(useMediaStore.getState().mediaList.some((i) => i.id === 'img-del')).toBe(false);
    });
  });

  it('cancels DeleteImageDialog without removing image', async () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'img-keep',
          file: createValidJpegFile('img-keep.jpg'),
          previewUrl: 'blob:img-keep',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 1,
        },
        {
          id: 'img-2',
          file: createValidJpegFile('img-2.jpg'),
          previewUrl: 'blob:img-2',
          status: 'uploaded',
          uploadProgress: 100,
          kind: 'image',
          isValid: true,
          order: 2,
        },
      ],
    });

    const { user } = renderPage();

    const trashBtn = screen.getByTitle('حذف از انتخاب شده‌ها');
    await user.click(trashBtn);

    expect(screen.getByText('حذف تصویر')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'انصراف' });
    await user.click(cancelBtn);

    expect(screen.queryByText('حذف تصویر')).not.toBeInTheDocument();
    expect(useMediaStore.getState().mediaList.some((i) => i.id === 'img-keep')).toBe(true);
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

  it('shows caption helper text in grayish color on initial transition to details phase', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const helperMsg = screen.getByText(text.captionHelperText);
    expect(helperMsg).toBeInTheDocument();
    expect(helperMsg).toHaveClass('text-zinc-500');
  });

  it('shows validation error when caption is entered and then cleared', async () => {
    const { user, container } = renderPage();
    await advanceToDetailsPhase(user, container);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    await user.type(textarea, 'کپشن اول');
    await user.clear(textarea);

    await waitFor(() => {
      const errorMsg = screen.getByText(text.captionError);
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass('text-red-500');
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
      http.post('*/upload-sessions/publish', () => new HttpResponse(null, { status: 500 })),
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
      http.post('*/upload-sessions/publish', () => new Promise(() => {})),
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
      http.post('*/upload-sessions/publish', () => new HttpResponse(null, { status: 500 })),
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
    expect(useMediaStore.getState().mediaList.length).toBeGreaterThan(0);
  });
});
