import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * milliseconds of inactivity.
 *
 * When `value` changes, the effect cleanup clears the previous timer and a new
 * one starts — `value` in the closure is always fresh because the effect
 * re-runs with a new closure on every dependency change. No ref needed.
 *
 * The setState call happens inside the async setTimeout callback, NOT
 * synchronously in the effect body, so this is not subject to the React
 * Compiler's "setState synchronously within an effect" restriction.
 */
export function useDebounce<T>(value: T, delayMs: number = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
