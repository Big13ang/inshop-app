/**
 * Shared phone number fixtures for E2E tests.
 *
 * QA principle: E2E tests should not import from feature __tests__ directories.
 * This file provides the same test data as features/auth/login/__tests__/fixtures/phones.ts
 * but is owned by the E2E test layer.
 */

export const VALID_PHONES = {
  standard: '09171234567',
} as const;

export const INVALID_PHONES = {
  tooShort: '0917123',
  nineDigits: '917123456',
  tooLong: '091712345678',
  withoutLeadingZero: '9171234567',
  international: '+989171234567',
  allZeros: '00000000000',
  foreign: '+14155552671',
  letters: 'abcdefghijk',
  whitespace: '   ',
  hyphenSeparated: '091-712-3456',
  persianDigits: '۰۹۱۷۱۲۳۴۵۶۷',
  specialChars: '0917123#$%',
  leadingTrailingSpace: ' 09171234567 ',
  empty: '',
} as const;
