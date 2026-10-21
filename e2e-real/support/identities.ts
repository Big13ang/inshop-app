import { randomInt } from 'node:crypto';

/**
 * A phone number no other test uses, so tests can run in parallel against one
 * database without cleanup. The 0999 prefix keeps E2E users easy to spot.
 */
export function uniquePhone(): string {
  return `0999${randomInt(0, 10_000_000).toString().padStart(7, '0')}`;
}

/** A national ID no other test uses; the backend only checks it is 10 digits */
export function uniqueNationalId(): string {
  return randomInt(0, 10_000_000_000).toString().padStart(10, '0');
}

/** An Instagram handle no other test uses; the backend drops a second application with the same one */
export function uniqueInstagramId(): string {
  return `e2e_${randomInt(0, 2 ** 40).toString(36)}`;
}

/** Meets the backend rule: 8–12 characters with English letters and digits */
export const E2E_PASSWORD = 'e2epass123';
