import { pullReducer, type PullState } from '../usePullToRefresh';

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
