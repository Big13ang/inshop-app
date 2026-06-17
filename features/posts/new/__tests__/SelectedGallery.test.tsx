/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectedGallery from '../components/SelectedGallery';
import { useMediaStore } from '../services/mediaStore';
import { type MediaItem } from '../types';

jest.mock('gsap', () => ({
  killTweensOf: jest.fn(),
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
}));

afterEach(() => {
  useMediaStore.setState({
    itemMap: new Map(),
    selectedIds: [],
    activePreviewIdx: 0,
  });
});

const createMockItem = (overrides: Partial<MediaItem>): MediaItem => ({
  id: 'item-1',
  name: 'photo.jpg',
  file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
  localUrl: 'blob:local-url',
  status: 'uploaded',
  progress: 100,
  mediaKind: 'image',
  ...overrides,
});

describe('SelectedGallery — empty state', () => {
  it('renders instructions and empty state when itemMap is empty', () => {
    // Current interface requires media prop, but we will soon refactor it.
    // For now we test with the new onRetry / onRemove interface.
    render(<SelectedGallery onRetry={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('گالری انتخابی')).toBeInTheDocument();
    expect(screen.getByText('تصویری انتخاب نشده')).toBeInTheDocument();
    expect(screen.getByText(/با دکمه «اضافه کردن»/)).toBeInTheDocument();
  });
});

describe('SelectedGallery — with items', () => {
  it('renders thumbnails for items in the store', () => {
    const itemMap = new Map<string, MediaItem>([
      ['id-1', createMockItem({ id: 'id-1', status: 'uploaded', uploadedUrl: 'https://example.com/1.jpg' })],
      ['id-2', createMockItem({ id: 'id-2', status: 'uploading', progress: 45 })],
    ]);
    useMediaStore.setState({ itemMap });

    const { container } = render(<SelectedGallery onRetry={jest.fn()} onRemove={jest.fn()} />);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/1.jpg');
    expect(images[1]).toHaveAttribute('src', 'blob:local-url');

    // Expect English digits for the progress number and Persian symbol for percent
    expect(screen.getByText('45٪')).toBeInTheDocument();
  });

  it('toggles selection when clicking an uploaded item', async () => {
    const itemMap = new Map<string, MediaItem>([
      ['id-1', createMockItem({ id: 'id-1', status: 'uploaded' })],
    ]);
    useMediaStore.setState({ itemMap });

    const originalToggle = useMediaStore.getState().toggleSelected;
    const spyToggle = jest.fn();
    useMediaStore.setState({ toggleSelected: spyToggle });

    const user = userEvent.setup();
    const { container } = render(<SelectedGallery onRetry={jest.fn()} onRemove={jest.fn()} />);

    const thumbnail = container.querySelector('img')!;
    await user.click(thumbnail);

    expect(spyToggle).toHaveBeenCalledWith('id-1');

    useMediaStore.setState({ toggleSelected: originalToggle });
  });

  it('calls onRetry when retry button is clicked on failed item', async () => {
    const itemMap = new Map<string, MediaItem>([
      ['id-fail', createMockItem({ id: 'id-fail', status: 'failed' })],
    ]);
    useMediaStore.setState({ itemMap });

    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<SelectedGallery onRetry={onRetry} onRemove={jest.fn()} />);

    const retryBtn = screen.getByRole('button', { name: 'تلاش دوباره' });
    await user.click(retryBtn);

    expect(onRetry).toHaveBeenCalledWith('id-fail');
  });

  it('opens delete bottom sheet on long press and calls onRemove on confirm', () => {
    jest.useFakeTimers();
    const itemMap = new Map<string, MediaItem>([
      ['id-1', createMockItem({ id: 'id-1', status: 'uploaded' })],
    ]);
    useMediaStore.setState({ itemMap });

    const onRemove = jest.fn();
    const { container } = render(<SelectedGallery onRetry={jest.fn()} onRemove={onRemove} />);

    const thumbnail = container.querySelector('img')!;

    // Start hold
    fireEvent.mouseDown(thumbnail);

    // Fast-forward timers by 600ms to trigger long press
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Confirm dialog is shown
    expect(screen.getByText('حذف تصویر')).toBeInTheDocument();
    expect(screen.getByText('آیا از حذف این تصویر اطمینان دارید؟')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'حذف' });
    fireEvent.click(confirmBtn);

    expect(onRemove).toHaveBeenCalledWith('id-1');

    jest.useRealTimers();
  });

  it('opens delete bottom sheet on long press and closes on reject', () => {
    jest.useFakeTimers();
    const itemMap = new Map<string, MediaItem>([
      ['id-1', createMockItem({ id: 'id-1', status: 'uploaded' })],
    ]);
    useMediaStore.setState({ itemMap });

    const { container } = render(<SelectedGallery onRetry={jest.fn()} onRemove={jest.fn()} />);

    const thumbnail = container.querySelector('img')!;

    // Start hold
    fireEvent.mouseDown(thumbnail);

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.getByText('حذف تصویر')).toBeInTheDocument();

    const rejectBtn = screen.getByRole('button', { name: 'انصراف' });
    // First act: flush the click (setPendingDeleteId → null, isOpen → false, effect schedules 320ms timer).
    act(() => { fireEvent.click(rejectBtn); });
    // Second act: advance past the Dialog's exit animation timer so setShouldRender(false) is flushed.
    act(() => { jest.advanceTimersByTime(350); });

    expect(screen.queryByText('حذف تصویر')).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
