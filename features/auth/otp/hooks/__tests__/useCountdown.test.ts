import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../useCountdown';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useCountdown', () => {
  it('initializes with the given seconds', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 60 })
    );

    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isExpired).toBe(false);
  });

  it('counts down every second', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 3 })
    );

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(2);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(1);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('calls onComplete when timer expires', () => {
    const onComplete = jest.fn();

    renderHook(() =>
      useCountdown({ initialSeconds: 2, onComplete })
    );

    act(() => jest.advanceTimersByTime(2000));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete if already expired on mount', () => {
    const onComplete = jest.fn();

    renderHook(() =>
      useCountdown({ initialSeconds: 0, onComplete })
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets to initial seconds', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 5 })
    );

    act(() => jest.advanceTimersByTime(3000));
    expect(result.current.timeLeft).toBe(2);

    act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(5);
    expect(result.current.isExpired).toBe(false);
  });

  it('resets to custom seconds when provided', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 5 })
    );

    act(() => result.current.reset(10));
    expect(result.current.timeLeft).toBe(10);
  });

  it('stops counting after expiration', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 1 })
    );

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(0);

    // Advance more time — should stay at 0
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(0);
  });

  it('restarts counting after reset from expired state', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 1, onComplete })
    );

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.isExpired).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(1);
    expect(result.current.isExpired).toBe(false);

    // Timer should be running again
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
