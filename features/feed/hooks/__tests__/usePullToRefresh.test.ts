import {
  keepPullDownFromScrollingNatively,
  pullReducer,
  type PullState,
} from '../usePullToRefresh';

describe('pullReducer (Finite State Machine)', () => {
  const initialState: PullState = {
    status: 'idle',
    pullDistance: 0,
  };

  it('transitions from idle to pulling on PULL action', () => {
    const nextState = pullReducer(initialState, { type: 'PULL', distance: 35 });
    expect(nextState).toEqual({
      status: 'pulling',
      pullDistance: 35,
    });
  });

  it('transitions to refreshing on START_REFRESH action', () => {
    const state: PullState = { status: 'pulling', pullDistance: 50 };
    const nextState = pullReducer(state, { type: 'START_REFRESH' });
    expect(nextState).toEqual({
      status: 'refreshing',
      pullDistance: 0,
    });
  });

  it('resets to idle on RESET action', () => {
    const state: PullState = { status: 'pulling', pullDistance: 30 };
    const nextState = pullReducer(state, { type: 'RESET' });
    expect(nextState).toEqual({
      status: 'idle',
      pullDistance: 0,
    });
  });

  it('ignores PULL action while refreshing', () => {
    const state: PullState = { status: 'refreshing', pullDistance: 0 };
    const nextState = pullReducer(state, { type: 'PULL', distance: 40 });
    expect(nextState).toBe(state);
  });
});

describe('keepPullDownFromScrollingNatively', () => {
  function createList(scrollTop: number): HTMLElement {
    const list = document.createElement('main');
    Object.defineProperty(list, 'scrollTop', { value: scrollTop, writable: true });
    return list;
  }

  function touch(list: HTMLElement, type: 'touchstart' | 'touchmove', clientY: number): TouchEvent {
    const event = new TouchEvent(type, {
      cancelable: true,
      touches: [{ clientY } as Touch],
    });
    list.dispatchEvent(event);
    return event;
  }

  it('blocks native overscroll when pulling down at the top of the list', () => {
    const list = createList(0);
    keepPullDownFromScrollingNatively(list);

    touch(list, 'touchstart', 100);
    const move = touch(list, 'touchmove', 160);

    expect(move.defaultPrevented).toBe(true);
  });

  it('lets the list scroll normally when it is not at the top', () => {
    const list = createList(250);
    keepPullDownFromScrollingNatively(list);

    touch(list, 'touchstart', 100);
    const move = touch(list, 'touchmove', 160);

    expect(move.defaultPrevented).toBe(false);
  });

  it('lets an upward swipe at the top scroll the list', () => {
    const list = createList(0);
    keepPullDownFromScrollingNatively(list);

    touch(list, 'touchstart', 160);
    const move = touch(list, 'touchmove', 100);

    expect(move.defaultPrevented).toBe(false);
  });

  it('stops blocking after cleanup', () => {
    const list = createList(0);
    const cleanup = keepPullDownFromScrollingNatively(list);
    cleanup();

    touch(list, 'touchstart', 100);
    const move = touch(list, 'touchmove', 160);

    expect(move.defaultPrevented).toBe(false);
  });
});
