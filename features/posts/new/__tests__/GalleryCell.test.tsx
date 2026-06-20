/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryCell from '../components/GalleryCell';
import { useMediaStore } from '../services/mediaStore';
import { type MediaItem } from '../types';

afterEach(() => {
  useMediaStore.setState({ itemMap: new Map(), selectedIds: [], activePreviewIdx: 0 });
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

describe('GalleryCell — cancelHold', () => {
  it('clears the long-press timer and does not fire onLongPress when the pointer leaves before holding 600ms', () => {
    jest.useFakeTimers();
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({})]]) });

    const onToggle = jest.fn();
    const onLongPress = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={onToggle} onLongPress={onLongPress} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.mouseDown(cell);
    fireEvent.mouseLeave(cell);

    act(() => { jest.advanceTimersByTime(600); });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

describe('GalleryCell — missing item', () => {
  it('renders nothing when the item is not in the store', () => {
    const { container } = render(
      <GalleryCell id="missing-id" selectionIndex={-1} onToggle={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('GalleryCell — startHold / endHold', () => {
  it('ignores right-clicks and does not start the long-press timer', () => {
    jest.useFakeTimers();
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({})]]) });

    const onLongPress = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={jest.fn()} onLongPress={onLongPress} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.mouseDown(cell, { button: 2 });
    act(() => { jest.advanceTimersByTime(600); });

    expect(onLongPress).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not toggle selection on mouseUp after a completed long-press', () => {
    jest.useFakeTimers();
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({})]]) });

    const onToggle = jest.fn();
    const onLongPress = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={onToggle} onLongPress={onLongPress} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.mouseDown(cell);
    act(() => { jest.advanceTimersByTime(600); });
    expect(onLongPress).toHaveBeenCalledWith('item-1');

    fireEvent.mouseUp(cell);
    expect(onToggle).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('calls onRetry on a quick tap (no long-press) for a failed item', () => {
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({ status: 'failed' })]]) });

    const onRetry = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={jest.fn()} onRetry={onRetry} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.mouseDown(cell);
    fireEvent.mouseUp(cell);

    expect(onRetry).toHaveBeenCalledWith('item-1');
  });

  it('calls onRetry on a quick tap for a cancelled item', () => {
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({ status: 'cancelled' })]]) });

    const onRetry = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={jest.fn()} onRetry={onRetry} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.mouseDown(cell);
    fireEvent.mouseUp(cell);

    expect(onRetry).toHaveBeenCalledWith('item-1');
  });

  it('does not crash on mouseUp without onRetry on a failed item', () => {
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({ status: 'failed' })]]) });

    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={jest.fn()} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    expect(() => {
      fireEvent.mouseDown(cell);
      fireEvent.mouseUp(cell);
    }).not.toThrow();
  });

  it('does not crash when mouseUp fires without a preceding mouseDown', () => {
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({})]]) });

    const onToggle = jest.fn();
    const { container } = render(
      <GalleryCell id="item-1" selectionIndex={-1} onToggle={onToggle} />,
    );

    const cell = container.querySelector('[data-status]') as HTMLElement;
    fireEvent.mouseUp(cell);

    expect(onToggle).toHaveBeenCalled();
  });
});

describe('GalleryCell — order badge', () => {
  it('toggles selection when the order badge is clicked directly', async () => {
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({})]]) });

    const onToggle = jest.fn();
    const user = userEvent.setup();
    render(<GalleryCell id="item-1" selectionIndex={0} onToggle={onToggle} />);

    await user.click(screen.getByText('1'));

    expect(onToggle).toHaveBeenCalled();
  });

  it('does not toggle selection when clicking the badge on a non-uploaded item', async () => {
    useMediaStore.setState({ itemMap: new Map([['item-1', createMockItem({ status: 'uploading' })]]) });

    const onToggle = jest.fn();
    const { container } = render(<GalleryCell id="item-1" selectionIndex={0} onToggle={onToggle} />);

    const badge = container.querySelector('.z-20') as HTMLElement;
    fireEvent.click(badge);

    expect(onToggle).not.toHaveBeenCalled();
  });
});
