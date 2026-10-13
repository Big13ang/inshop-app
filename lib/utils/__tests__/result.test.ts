import { Result } from '../result';

describe('Result', () => {
  it('creates ok result', () => {
    const res = Result.ok('value');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe('value');
    }
  });

  it('creates err result', () => {
    const res = Result.err(new Error('fail'));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.message).toBe('fail');
    }
  });

  it('handles async task with try', async () => {
    const success = await Result.try(async () => 42);
    expect(success.ok).toBe(true);
    if (success.ok) {
      expect(success.value).toBe(42);
    }

    const failure = await Result.try(async () => {
      throw new Error('boom');
    });
    expect(failure.ok).toBe(false);
  });

  it('handles synchronous task with trySync', () => {
    const success = Result.trySync(() => 42);
    expect(success.ok).toBe(true);
    if (success.ok) {
      expect(success.value).toBe(42);
    }

    const failure = Result.trySync(() => {
      throw new Error('sync-boom');
    });
    expect(failure.ok).toBe(false);
    if (!failure.ok) {
      expect((failure.error as Error).message).toBe('sync-boom');
    }
  });

  it('matches result variants with match', () => {
    const okRes = Result.ok('hello');
    const matchedOk = Result.match(okRes, {
      ok: (val) => `matched:${val}`,
      err: () => 'err',
    });
    expect(matchedOk).toBe('matched:hello');

    const errRes = Result.err('bad');
    const matchedErr = Result.match(errRes, {
      ok: () => 'ok',
      err: (err) => `caught:${err}`,
    });
    expect(matchedErr).toBe('caught:bad');
  });

  it('unwraps ok result and throws on err', () => {
    const okRes = Result.ok(100);
    expect(Result.unwrap(okRes)).toBe(100);

    const errRes = Result.err(new Error('unwrap-error'));
    expect(() => Result.unwrap(errRes)).toThrow('unwrap-error');
  });
});
