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
  async try<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
    try {
      return Result.ok(await promise);
    } catch (e) {
      return Result.err(e as E);
    }
  },
  match<T, E, R>(result: Result<T, E>, cases: { ok: (value: T) => R; err: (error: E) => R }): R {
    return result.ok ? cases.ok(result.value) : cases.err(result.error);
  },
  unwrap<T, E = unknown>(result: Result<T, E>): T {
    if (!result.ok) {
      if (result.error instanceof Error) {
        throw result.error;
      }
      const errObj = result.error as { message?: string } | null | undefined;
      throw new Error(errObj?.message || String(result.error));
    }
    return result.value;
  },
};
