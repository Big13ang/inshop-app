import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectedGallery from '../SelectedGallery';
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

describe('SelectedGallery Component (Behavior)', () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
  });

  describe('Empty State', () => {
    it('shows empty gallery placeholder message and instructions when no images are present', () => {
      render(<SelectedGallery />);

      expect(screen.getByText('تصویری انتخاب نشده')).toBeInTheDocument();
      expect(
        screen.getByText(/با دکمه «اضافه کردن» در پایین صفحه/)
      ).toBeInTheDocument();
      expect(screen.getByText('گالری انتخابی')).toBeInTheDocument();
    });
  });

  describe('Image Count Indicator', () => {
    it('displays current count of images against maximum limit', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-1' }),
        createMockMediaItem({ id: 'item-2' }),
      ]);

      render(<SelectedGallery />);

      expect(screen.getByText('2/10 تصویر')).toBeInTheDocument();
    });

    it('displays 10/10 count when gallery reaches capacity', () => {
      const tenItems = Array.from({ length: 10 }, (_, i) =>
        createMockMediaItem({ id: `item-${i + 1}` })
      );
      useMediaStore.getState().setMediaList(tenItems);

      render(<SelectedGallery />);

      expect(screen.getByText('10/10 تصویر')).toBeInTheDocument();
    });
  });

  describe('Selection & Order Badge Behavior', () => {
    it('keeps cell unselected when clicking an image that is still uploading', async () => {
      const user = userEvent.setup();
      const uploadingItem = createMockMediaItem({
        id: 'uploading-1',
        status: 'uploading',
        order: null,
      });
      useMediaStore.getState().setMediaList([uploadingItem]);

      render(<SelectedGallery />);

      const cell = screen.getByRole('button', { name: 'تصویر' });
      expect(cell).toHaveAttribute('aria-pressed', 'false');

      await user.click(cell);

      // Remains unpressed, no selection order badge rendered
      expect(cell).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('selects an uploaded image on click, showing pressed state and badge 1', async () => {
      const user = userEvent.setup();
      const uploadedItem = createMockMediaItem({
        id: 'item-1',
        status: 'uploaded',
        order: null,
      });
      useMediaStore.getState().setMediaList([uploadedItem]);

      render(<SelectedGallery />);

      const cell = screen.getByRole('button', { name: 'تصویر' });
      expect(cell).toHaveAttribute('aria-pressed', 'false');

      await user.click(cell);

      expect(cell).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('assigns sequential badges (1, 2, 3) in the order images are clicked', async () => {
      const user = userEvent.setup();
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-a', status: 'uploaded', order: null }),
        createMockMediaItem({ id: 'item-b', status: 'uploaded', order: null }),
        createMockMediaItem({ id: 'item-c', status: 'uploaded', order: null }),
      ]);

      render(<SelectedGallery />);

      const cells = screen.getAllByRole('button', { name: 'تصویر' });
      expect(cells.length).toBe(3);

      // Click cell 0, then cell 2, then cell 1
      await user.click(cells[0]); // First clicked -> badge 1
      await user.click(cells[2]); // Second clicked -> badge 2
      await user.click(cells[1]); // Third clicked -> badge 3

      expect(cells[0]).toHaveAttribute('aria-pressed', 'true');
      expect(cells[2]).toHaveAttribute('aria-pressed', 'true');
      expect(cells[1]).toHaveAttribute('aria-pressed', 'true');

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('re-indexes remaining badges down when an earlier selected item is deselected', async () => {
      const user = userEvent.setup();
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-a', status: 'uploaded', order: 1 }),
        createMockMediaItem({ id: 'item-b', status: 'uploaded', order: 2 }),
        createMockMediaItem({ id: 'item-c', status: 'uploaded', order: 3 }),
      ]);

      render(<SelectedGallery />);

      // Initial state has badges 1, 2, 3
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Click the first selected cell to deselect it
      const firstSelectedCell = screen.getByRole('button', { name: /تصویر 1/ });
      await user.click(firstSelectedCell);

      // Now only 2 items are selected; badge 3 is gone, and badges 1 and 2 exist
      expect(firstSelectedCell).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });

    it('assigns the next available order number when re-selecting a deselected item', async () => {
      const user = userEvent.setup();
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'item-a', status: 'uploaded', order: 1 }),
        createMockMediaItem({ id: 'item-b', status: 'uploaded', order: null }),
      ]);

      render(<SelectedGallery />);

      // Item A is selected (badge 1); Item B is unselected
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();

      // Click unselected Item B
      const unselectedCell = screen.getByRole('button', { name: 'تصویر' });
      await user.click(unselectedCell);

      // Now Item B gets badge 2
      expect(unselectedCell).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
