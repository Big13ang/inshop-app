import { renderHook, act } from '@testing-library/react';
import { useDragToDismiss } from '../useDragToDismiss';

function mouseEvent(clientY: number, buttons = 1) {
  return { clientY, buttons } as React.MouseEvent;
}

describe('useDragToDismiss', () => {
  it('calls onDismiss when dragged past the distance threshold', () => {
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const { result } = renderHook(() =>
      useDragToDismiss({ threshold: 100, onDismiss, onCancel }),
    );

    act(() => {
      result.current.onMouseDown(mouseEvent(0));
      result.current.onMouseMove(mouseEvent(150));
      result.current.onMouseUp();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when dragged below the threshold', () => {
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const { result } = renderHook(() =>
      useDragToDismiss({ threshold: 100, onDismiss, onCancel }),
    );

    act(() => {
      result.current.onMouseDown(mouseEvent(0));
      result.current.onMouseMove(mouseEvent(50));
      result.current.onMouseUp();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('ignores mouse move when no button is pressed', () => {
    const onDragMove = jest.fn();
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const { result } = renderHook(() =>
      useDragToDismiss({ threshold: 100, onDismiss, onCancel, onDragMove }),
    );

    act(() => {
      result.current.onMouseDown(mouseEvent(0));
      result.current.onMouseMove(mouseEvent(150, 0)); // buttons: 0 — should be ignored
      result.current.onMouseUp();
    });

    expect(onDragMove).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1); // distance never moved past 0
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const { result } = renderHook(() =>
      useDragToDismiss({ threshold: 100, onDismiss, onCancel, enabled: false }),
    );

    act(() => {
      result.current.onMouseDown(mouseEvent(0));
      result.current.onMouseMove(mouseEvent(150));
      result.current.onMouseUp();
    });

    expect(onDismiss).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('treats a fast small drag as a dismiss once it clears the velocity threshold', () => {
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0); // drag start
    nowSpy.mockReturnValueOnce(50); // drag end, 50ms later

    const { result } = renderHook(() =>
      useDragToDismiss({
        threshold: 100,
        velocityThreshold: 0.4,
        velocityDistance: 20,
        onDismiss,
        onCancel,
      }),
    );

    act(() => {
      result.current.onMouseDown(mouseEvent(0));
      result.current.onMouseMove(mouseEvent(30)); // 30px in 50ms → velocity 0.6
      result.current.onMouseUp();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  it('does not dismiss a fast small drag when no velocityThreshold is configured', () => {
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0);
    nowSpy.mockReturnValueOnce(50);

    const { result } = renderHook(() =>
      useDragToDismiss({ threshold: 100, onDismiss, onCancel }),
    );

    act(() => {
      result.current.onMouseDown(mouseEvent(0));
      result.current.onMouseMove(mouseEvent(30));
      result.current.onMouseUp();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    nowSpy.mockRestore();
  });
});
