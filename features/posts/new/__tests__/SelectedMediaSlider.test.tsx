/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import SelectedMediaSlider from '../components/SelectedMediaSlider';
import { useMediaStore } from '../services/mediaStore';
import type { MediaItem } from '../types';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('@/components/ui/PostSlider', () => ({
  __esModule: true,
  default: ({ items, activeSlide, onSlideChange }: { items: Array<{ url: string }>; activeSlide?: number; onSlideChange?: (idx: number) => void }) => (
    <div data-testid="post-slider">
      {items.map((m, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={m.url} alt="" onClick={() => onSlideChange?.(i)} data-active={i === activeSlide} />
      ))}
    </div>
  ),
}));

jest.mock('../services/uploadSession', () => ({
  useUploadSession: () => ({
    data: { uploadSessionId: 'test-session-id' },
  }),
}));

jest.mock('@/features/posts/services/postsQueryService', () => ({
  postsQueryService: {
    useDeleteUploadSessionPhoto: () => ({
      isPending: false,
      mutate: (_params: unknown, options?: { onSuccess?: () => void; onSettled?: () => void }) => {
        options?.onSuccess?.();
        options?.onSettled?.();
      },
    }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function uploadedItem(id: string, url: string, order: number = 1): MediaItem {
  return {
    id,
    kind: 'image',
    status: 'uploaded',
    uploadProgress: 100,
    order,
    previewUrl: url,
    file: new File([''], `${id}.jpg`, { type: 'image/jpeg' }),
    isValid: true,
  };
}

afterEach(() => {
  useMediaStore.getState().reset();
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('SelectedMediaSlider — empty state', () => {
  it('renders the empty-state placeholder when no items are selected', () => {
    render(<SelectedMediaSlider />);
    expect(screen.getByText('تصویری انتخاب نشده')).toBeInTheDocument();
  });

  it('does not render the slider when no items are selected', () => {
    render(<SelectedMediaSlider />);
    expect(screen.queryByTestId('post-slider')).not.toBeInTheDocument();
  });
});

// ── With items ────────────────────────────────────────────────────────────────

describe('SelectedMediaSlider — with selected items', () => {
  function setupTwoItems() {
    useMediaStore.setState({
      mediaList: [
        uploadedItem('id-1', 'https://cdn/1.jpg', 1),
        uploadedItem('id-2', 'https://cdn/2.jpg', 2),
      ],
    });
  }

  it('renders the slider when items are selected', () => {
    setupTwoItems();
    render(<SelectedMediaSlider />);
    expect(screen.getByTestId('post-slider')).toBeInTheDocument();
  });

  it('displays the slide counter for the active index', () => {
    setupTwoItems();
    render(<SelectedMediaSlider />);
    expect(screen.getByText('فایل 1 از 2')).toBeInTheDocument();
  });

  it('passes uploaded URLs to the slider', () => {
    setupTwoItems();
    const { container } = render(<SelectedMediaSlider />);
    const imgs = container.querySelectorAll('[data-testid="post-slider"] img');
    expect(imgs[0]).toHaveAttribute('src', 'https://cdn/1.jpg');
    expect(imgs[1]).toHaveAttribute('src', 'https://cdn/2.jpg');
  });

  it('hides the remove button when only one item is selected', () => {
    useMediaStore.setState({
      mediaList: [uploadedItem('id-1', 'https://cdn/1.jpg', 1)],
    });
    render(<SelectedMediaSlider />);
    expect(screen.queryByTitle('حذف از انتخاب شده‌ها')).not.toBeInTheDocument();
  });

  it('shows the remove button when multiple items are selected', () => {
    setupTwoItems();
    render(<SelectedMediaSlider />);
    expect(screen.getByTitle('حذف از انتخاب شده‌ها')).toBeInTheDocument();
  });

  it('does not show the remove button in compact mode even with multiple items', () => {
    setupTwoItems();
    render(<SelectedMediaSlider isCompact />);
    expect(screen.queryByTitle('حذف از انتخاب شده‌ها')).not.toBeInTheDocument();
  });
});
