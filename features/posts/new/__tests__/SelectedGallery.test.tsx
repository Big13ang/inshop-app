/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectedGallery from '../components/SelectedGallery';
import { useMediaStore } from '../services/mediaStore';
import { type MediaItem } from '../types';

afterEach(() => {
  useMediaStore.getState().reset();
});

const createMockItem = (overrides?: Partial<MediaItem>): MediaItem => ({
  id: 'id-1',
  kind: 'image',
  status: 'uploaded',
  uploadProgress: 100,
  order: 1,
  previewUrl: 'https://example.com/1.jpg',
  file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
  isValid: true,
  ...overrides,
});

describe('SelectedGallery — empty state', () => {
  it('renders instructions and empty state when mediaList is empty', () => {
    render(<SelectedGallery />);
    expect(screen.getByText('گالری انتخابی')).toBeInTheDocument();
    expect(screen.getByText('تصویری انتخاب نشده')).toBeInTheDocument();
    expect(screen.getByText(/با دکمه «اضافه کردن»/)).toBeInTheDocument();
  });
});

describe('SelectedGallery — with items', () => {
  it('renders thumbnails for items in the store', () => {
    const mediaList: MediaItem[] = [
      createMockItem({ id: 'id-1', status: 'uploaded', previewUrl: 'https://example.com/1.jpg' }),
      createMockItem({ id: 'id-2', status: 'uploading', uploadProgress: 45, previewUrl: 'blob:local-url' }),
    ];
    useMediaStore.setState({ mediaList });

    const { container } = render(<SelectedGallery />);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/1.jpg');
    expect(images[1]).toHaveAttribute('src', 'blob:local-url');

    expect(screen.getByText('45٪')).toBeInTheDocument();
  });

  it('shows the at-limit count in red when MAX_IMAGES is reached', () => {
    const mediaList: MediaItem[] = Array.from({ length: 10 }, (_, i) =>
      createMockItem({ id: `id-${i}`, order: i + 1 })
    );
    useMediaStore.setState({ mediaList });

    render(<SelectedGallery />);

    const counter = screen.getByText('10/10 تصویر');
    expect(counter).toHaveClass('text-red-500');
  });

  it('reorders items when clicking an item in the gallery', async () => {
    const mediaList: MediaItem[] = [
      createMockItem({ id: 'id-1', order: 1 }),
      createMockItem({ id: 'id-2', order: 2 }),
    ];
    useMediaStore.setState({ mediaList });

    const user = userEvent.setup();
    const { container } = render(<SelectedGallery />);

    const cells = container.querySelectorAll('[data-status]');
    await user.click(cells[0]);

    // Deselecting id-1 should make id-1 order null, and id-2 order 1
    const updated = useMediaStore.getState().mediaList;
    expect(updated[0].order).toBeNull();
    expect(updated[1].order).toBe(1);
  });
});
