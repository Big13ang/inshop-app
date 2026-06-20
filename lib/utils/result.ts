export type Result<T, E = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },
  err<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },
  async try<T>(promise: Promise<T>): Promise<Result<T>> {
    try {
      return Result.ok(await promise);
    } catch (e) {
      return Result.err(e);
    }
  },
  match<T, E, R>(result: Result<T, E>, cases: { ok: (value: T) => R; err: (error: E) => R }): R {
    return result.ok ? cases.ok(result.value) : cases.err(result.error);
  },
};
