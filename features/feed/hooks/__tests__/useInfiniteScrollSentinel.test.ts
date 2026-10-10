import { renderHook } from '@testing-library/react';
import { useInfiniteScrollSentinel } from '../useInfiniteScrollSentinel';

describe('useInfiniteScrollSentinel hook', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();

    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: observeMock,
        unobserve: jest.fn(),
        disconnect: disconnectMock,
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('attaches observer to node and disconnects on unmount', () => {
    const fetchNextPage = jest.fn();
    const div = document.createElement('div');

    const { result, unmount } = renderHook(() =>
      useInfiniteScrollSentinel({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
      })
    );

    // Simulate attaching ref to DOM node
    Object.defineProperty(result.current, 'current', {
      value: div,
      writable: true,
    });

    const { rerender } = renderHook(
      ({ hasNextPage, isFetchingNextPage }) => {
        const ref = useInfiniteScrollSentinel({
          hasNextPage,
          isFetchingNextPage,
          fetchNextPage,
        });
        Object.defineProperty(ref, 'current', { value: div, writable: true });
        return ref;
      },
      {
        initialProps: { hasNextPage: true, isFetchingNextPage: false },
      }
    );

    expect(observeMock).toHaveBeenCalledWith(div);

    // Trigger intersection
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    // When fast scrolling fires multiple intersections while locked, should NOT fire fetchNextPage again
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    // Re-render when fetching is active
    rerender({ hasNextPage: true, isFetchingNextPage: true });

    // When fetch completes and isFetchingNextPage becomes false, lock is released
    rerender({ hasNextPage: true, isFetchingNextPage: false });

    // Next intersection triggers fetchNextPage again
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    expect(fetchNextPage).toHaveBeenCalledTimes(2);

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
