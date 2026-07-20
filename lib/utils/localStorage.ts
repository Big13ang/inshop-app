import { Result } from './result';

/**
 * Type-safe localStorage wrapper that returns Result instead of throwing.
 * All methods are synchronous and safe to call in try-catch-free code.
 */
export const storage = {
  get(key: string): Result<string | null> {
    try {
      return Result.ok(localStorage.getItem(key));
    } catch (e) {
      return Result.err(e);
    }
  },

  set(key: string, value: string): Result<void> {
    try {
      localStorage.setItem(key, value);
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e);
    }
  },

  remove(key: string): Result<void> {
    try {
      localStorage.removeItem(key);
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e);
    }
  },

  has(key: string): boolean {
    const result = storage.get(key);
    return result.ok && result.value !== null;
  },
};
