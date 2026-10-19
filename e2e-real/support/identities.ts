import { randomInt } from 'node:crypto';

/**
 * A phone number no other test uses, so tests can run in parallel against one
 * database without cleanup. The 0999 prefix keeps E2E users easy to spot.
 */
export function uniquePhone(): string {
  return `0999${randomInt(0, 10_000_000).toString().padStart(7, '0')}`;
}

/** Meets the backend rule: 8–12 characters with English letters and digits */
export const E2E_PASSWORD = 'e2epass123';
