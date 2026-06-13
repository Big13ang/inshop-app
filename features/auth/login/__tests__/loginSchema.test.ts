/**
 * Unit tests — loginSchema (pure validation logic)
 *
 * Layer:   Unit (no DOM, no rendering)
 * Runner:  Jest
 * Pattern: Black-box — test public API (safeParse), never internals
 *
 * Coverage mandate (QA rule: schema must be 100% unit-tested):
 *   ✅ All valid format variants
 *   ✅ All invalid format variants
 *   ✅ Boundary values (min/max length)
 *   ✅ Edge cases (whitespace, separators, null coercion)
 *   ✅ Error message quality (non-empty, Persian text)
 */

import { loginSchema } from '../constants';
import {
  VALID_PHONES,
  INVALID_PHONES,
  VALID_PHONE_LIST,
  INVALID_PHONE_LIST,
} from './fixtures/phones';

// ─── Helpers ────────────────────────────────────────────────────────────────

const valid = (phone: string) => loginSchema.safeParse({ phone }).success;

const errorFor = (phone: string): string | null => {
  const result = loginSchema.safeParse({ phone });

  if (result.success) return null;

  return result.error.issues[0]?.message ?? null;
};

// ─── Valid formats ───────────────────────────────────────────────────────────

describe('loginSchema — accepts valid Iranian mobile numbers', () => {
  it.each(VALID_PHONE_LIST)('accepts "$label" → "$phone"', ({ phone }) => {
    expect(valid(phone)).toBe(true);
  });

  // Explicit named assertions for documentation clarity
  it('accepts standard 09xx format', () => {
    expect(valid(VALID_PHONES.standard)).toBe(true);
  });
});

// ─── Invalid formats ─────────────────────────────────────────────────────────

describe('loginSchema — rejects invalid inputs', () => {
  // Parametrised — all invalid cases must fail
  it.each(INVALID_PHONE_LIST)('rejects "$label" → "$phone"', ({ phone }) => {
    expect(valid(phone)).toBe(false);
  });

  // Boundary value analysis — explicit length boundaries
  describe('boundary values', () => {
    it('rejects 7-digit number (below minimum boundary)', () => {
      expect(valid(INVALID_PHONES.tooShort)).toBe(false);
    });

    it('rejects 9-digit number (one below 10-digit minimum boundary)', () => {
      expect(valid(INVALID_PHONES.nineDigits)).toBe(false);
    });

    it('rejects 12-digit number (above maximum boundary)', () => {
      expect(valid(INVALID_PHONES.tooLong)).toBe(false);
    });
  });

  // Edge cases that commonly slip through
  describe('edge cases', () => {
    it('rejects whitespace-only input', () => {
      expect(valid(INVALID_PHONES.whitespace)).toBe(false);
    });

    it('rejects hyphen-separated format (091-712-3456)', () => {
      expect(valid(INVALID_PHONES.hyphenSeparated)).toBe(false);
    });

    it('rejects all-zeros number', () => {
      expect(valid(INVALID_PHONES.allZeros)).toBe(false);
    });

    it('rejects a foreign (US) number', () => {
      expect(valid(INVALID_PHONES.foreign)).toBe(false);
    });

    it('rejects purely alphabetic input', () => {
      expect(valid(INVALID_PHONES.letters)).toBe(false);
    });

    it('rejects localized Persian digits', () => {
      expect(valid(INVALID_PHONES.persianDigits)).toBe(false);
    });

    it('rejects special characters', () => {
      expect(valid(INVALID_PHONES.specialChars)).toBe(false);
    });

    it('rejects 9xx format (no leading zero)', () => {
      expect(valid(INVALID_PHONES.withoutLeadingZero)).toBe(false);
    });

    it('rejects +98 international format', () => {
      expect(valid(INVALID_PHONES.international)).toBe(false);
    });

    it('rejects leading/trailing whitespace', () => {
      expect(valid(INVALID_PHONES.leadingTrailingSpace)).toBe(false);
    });

    it('rejects empty string', () => {
      expect(valid(INVALID_PHONES.empty)).toBe(false);
    });
  });
});

// ─── Error message quality ───────────────────────────────────────────────────

describe('loginSchema — error message quality', () => {
  it('returns a non-null error message for empty input', () => {
    expect(errorFor(INVALID_PHONES.empty)).not.toBeNull();
  });

  it('returns a non-empty error message for empty input', () => {
    expect(errorFor(INVALID_PHONES.empty)?.length).toBeGreaterThan(0);
  });

  it('returns a non-null error message for an invalid format', () => {
    expect(errorFor(INVALID_PHONES.tooShort)).not.toBeNull();
  });

  it('returns Persian text in the error message (contains Persian characters)', () => {
    // Verify error messages are localised — range U+0600–U+06FF = Arabic/Persian block
    const msg = errorFor(INVALID_PHONES.tooShort)!;
    expect(/[\u0600-\u06FF]/.test(msg)).toBe(true);
  });

  it('error message for invalid format contains an example phone number', () => {
    const msg = errorFor(INVALID_PHONES.letters)!;
    // The schema error mentions the example format (09171234567)
    expect(msg).toMatch(/09\d{9}/);
  });

  it('returns no error for valid phone (null error)', () => {
    expect(errorFor(VALID_PHONES.standard)).toBeNull();
  });
});
