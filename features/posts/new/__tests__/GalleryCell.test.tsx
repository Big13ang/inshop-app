/// <reference types="@testing-library/jest-dom" />
import { render, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryCell from '../components/GalleryCell';
import { useMediaStore } from '../services/mediaStore';
import { type MediaItem } from '../types';

afterEach(() => {
  useMediaStore.getState().reset();
});

const createMockItem = (overrides?: Partial<MediaItem>): MediaItem => ({
  id: 'item-1',
  kind: 'image',
  status: 'uploaded',
  uploadProgress: 100,
  order: 1,
  previewUrl: 'blob:local-url',
  file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
  isValid: true,
  ...overrides,
});

describe('GalleryCell — rendering & click behavior', () => {
  it('renders nothing when the item is not in the store', () => {
    const { container } = render(
      <GalleryCell id="missing-id" selectionIndex={-1} onToggle={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('triggers onToggle when an uploaded cell is clicked', async () => {
    const item = createMockItem();
    useMediaStore.setState({ mediaList: [item] });

    const onToggle = jest.fn();
    const user = userEvent.setup();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={0} onToggle={onToggle} />
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    expect(cell).toBeInTheDocument();

    await user.click(cell);
    expect(onToggle).toHaveBeenCalled();
  });

  it('does not trigger onToggle when an uploading cell is clicked', async () => {
    const item = createMockItem({ status: 'uploading', uploadProgress: 50 });
    useMediaStore.setState({ mediaList: [item] });

    const onToggle = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={onToggle} />
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.click(cell);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('displays the selection order badge index correctly when selected', () => {
    const item = createMockItem({ order: 1 });
    useMediaStore.setState({ mediaList: [item] });

    render(<GalleryCell id="item-1" selectionIndex={0} onToggle={jest.fn()} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
