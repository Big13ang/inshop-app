/**
 * Centralised test data — Single Source of Truth for phone number fixtures.
 *
 * Imported by BOTH:
 *   - Unit tests (Jest):      features/auth/login/__tests__/loginSchema.test.ts
 *   - Component tests (RTL):  features/auth/login/__tests__/Login.test.tsx
 *   - E2E tests (Playwright): e2e/auth/login.spec.ts
 *
 * Why here and not in e2e/?
 *   This data is domain knowledge about the auth feature.
 *   It lives next to the feature it describes, not next to the runner.
 *
 * QA RULE: Never hardcode test data inline. Define it here, name it semantically.
 */

export const VALID_PHONES = {
  /** Most common format: starts with 09 + 9 digits */
  standard: '09171234567',
} as const;

export const INVALID_PHONES = {
  /** 7 digits — too short (below-minimum boundary) */
  tooShort: '0917123',
  /** 9 digits — one below the 10-digit minimum boundary */
  nineDigits: '917123456',
  /** 12 digits — too long (above-maximum boundary) */
  tooLong: '091712345678',
  /** Without the leading zero — no longer valid */
  withoutLeadingZero: '9171234567',
  /** International E.164 format — no longer valid */
  international: '+989171234567',
  /** All zeros — structurally invalid */
  allZeros: '00000000000',
  /** US number — valid E.164 but wrong country code */
  foreign: '+14155552671',
  /** Letters — completely non-numeric */
  letters: 'abcdefghijk',
  /** Whitespace only — should fail min(1) */
  whitespace: '   ',
  /** Hyphen-separated — invalid per strict regex */
  hyphenSeparated: '091-712-3456',
  /** Localized Persian digits — rejected by regex */
  persianDigits: '۰۹۱۷۱۲۳۴۵۶۷',
  /** Special characters — rejected by regex */
  specialChars: '0917123#$%',
  /** Leading and trailing whitespace — rejected by regex */
  leadingTrailingSpace: ' 09171234567 ',
  /** Empty string */
  empty: '',
} as const;

/** Flat arrays — handy for `it.each()` tables */
export const VALID_PHONE_LIST = Object.entries(VALID_PHONES).map(
  ([label, phone]) => ({ label, phone })
);
export const INVALID_PHONE_LIST = Object.entries(INVALID_PHONES).map(
  ([label, phone]) => ({ label, phone })
);
