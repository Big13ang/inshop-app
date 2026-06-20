/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectedMediaSlider from '../components/SelectedMediaSlider';
import { useMediaStore } from '../services/mediaStore';
import type { MediaItem } from '../types';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('@/components/ui/PostSlider', () => ({
  __esModule: true,
  default: ({ media, onSlideChange }: { media: Array<{ url: string; type: string }>; onSlideChange?: (idx: number) => void }) => (
    <div data-testid="post-slider">
      {media.map((m, i) => (
        <img key={i} src={m.url} alt="" onClick={() => onSlideChange?.(i)} />
      ))}
    </div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function uploadedItem(id: string, url: string): MediaItem {
  return {
    id,
    name: `${id}.jpg`,
    file: null,
    localUrl: `blob:${id}`,
    uploadedUrl: url,
    status: 'uploaded',
    progress: 100,
    mediaKind: 'image',
  };
}

afterEach(() => {
  useMediaStore.setState({ itemMap: new Map(), selectedIds: [], activePreviewIdx: 0 });
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
      itemMap: new Map([
        ['id-1', uploadedItem('id-1', 'https://cdn/1.jpg')],
        ['id-2', uploadedItem('id-2', 'https://cdn/2.jpg')],
      ]),
      selectedIds: ['id-1', 'id-2'],
      activePreviewIdx: 0,
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

  it('reflects activePreviewIdx in the counter', () => {
    useMediaStore.setState({
      itemMap: new Map([
        ['id-1', uploadedItem('id-1', 'https://cdn/1.jpg')],
        ['id-2', uploadedItem('id-2', 'https://cdn/2.jpg')],
        ['id-3', uploadedItem('id-3', 'https://cdn/3.jpg')],
      ]),
      selectedIds: ['id-1', 'id-2', 'id-3'],
      activePreviewIdx: 2,
    });
    render(<SelectedMediaSlider />);
    expect(screen.getByText('فایل 3 از 3')).toBeInTheDocument();
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
      itemMap: new Map([['id-1', uploadedItem('id-1', 'https://cdn/1.jpg')]]),
      selectedIds: ['id-1'],
      activePreviewIdx: 0,
    });
    render(<SelectedMediaSlider />);
    expect(screen.queryByTitle('حذف از انتخاب شده‌ها')).not.toBeInTheDocument();
  });

  it('shows the remove button when multiple items are selected', () => {
    setupTwoItems();
    render(<SelectedMediaSlider />);
    expect(screen.getByTitle('حذف از انتخاب شده‌ها')).toBeInTheDocument();
  });

  it('clicking remove deselects the item at the active index', async () => {
    const user = userEvent.setup();
    setupTwoItems();
    render(<SelectedMediaSlider />);

    await user.click(screen.getByTitle('حذف از انتخاب شده‌ها'));

    // activePreviewIdx is 0 → 'id-1' should be removed from selectedIds
    expect(useMediaStore.getState().selectedIds).not.toContain('id-1');
    expect(useMediaStore.getState().selectedIds).toContain('id-2');
  });

  it('does not show the remove button in compact mode even with multiple items', () => {
    setupTwoItems();
    render(<SelectedMediaSlider isCompact />);
    expect(screen.queryByTitle('حذف از انتخاب شده‌ها')).not.toBeInTheDocument();
  });

  it('updates activePreviewIdx in the store when the slider changes slides', async () => {
    const user = userEvent.setup();
    setupTwoItems();
    const { container } = render(<SelectedMediaSlider />);

    const slides = container.querySelectorAll('[data-testid="post-slider"] img');
    await user.click(slides[1]);

    expect(useMediaStore.getState().activePreviewIdx).toBe(1);
  });

  it('falls back to localUrl when an item has no uploadedUrl yet', () => {
    useMediaStore.setState({
      itemMap: new Map([
        ['id-1', { id: 'id-1', name: 'id-1.jpg', file: null, localUrl: 'blob:local-id-1', status: 'uploading', progress: 50, mediaKind: 'image' }],
      ]),
      selectedIds: ['id-1'],
      activePreviewIdx: 0,
    });
    const { container } = render(<SelectedMediaSlider />);

    const img = container.querySelector('[data-testid="post-slider"] img');
    expect(img).toHaveAttribute('src', 'blob:local-id-1');
  });

  it('does not crash when removing at an index with no corresponding selected id', async () => {
    const user = userEvent.setup();
    useMediaStore.setState({
      itemMap: new Map([
        ['id-1', uploadedItem('id-1', 'https://cdn/1.jpg')],
        ['id-2', uploadedItem('id-2', 'https://cdn/2.jpg')],
      ]),
      selectedIds: ['id-1', 'id-2'],
      activePreviewIdx: 5, // out of range
    });
    render(<SelectedMediaSlider />);

    await expect(
      user.click(screen.getByTitle('حذف از انتخاب شده‌ها')),
    ).resolves.not.toThrow();

    expect(useMediaStore.getState().selectedIds).toEqual(['id-1', 'id-2']);
  });
});
