/**
 * Centralised test data — Single Source of Truth for password fixtures.
 *
 * Aligned 1:1 with backend policy (inshop-back-end/src/auth/password.util.ts):
 *   - Pattern: /^(?=.*[A-Za-z])(?=.*\d)\S{8,12}$/
 *   - Min 8 characters
 *   - Max 12 characters
 *   - At least 1 ASCII letter ([A-Za-z])
 *   - At least 1 digit (\d)
 *   - No internal whitespace
 *   - ASCII printable characters only
 */

export const VALID_PASSWORDS = {
  /** 8 chars (min boundary): letters + numbers */
  standard: 'abc12345',
  /** 12 chars (max boundary): letters + numbers */
  maxBoundary: 'abcdefgh1234',
  /** With allowed ASCII symbols */
  withSpecialChars: 'P@ssw0rd!1',
  /** Numbers first, then letters */
  numbersFirst: '1234Pass',
  /** Mixed casing and numbers */
  mixedCase: 'Pass1234',
} as const;

export const INVALID_PASSWORDS = {
  /** Empty string */
  empty: '',
  /** 7 characters — below 8-character minimum boundary */
  tooShort: 'abc1234',
  /** 13 characters — above 12-character maximum boundary */
  tooLong: 'abcdefgh12345',
  /** Digits only — missing ASCII letter */
  noLetters: '12345678',
  /** Letters only — missing digit */
  noNumbers: 'abcdefgh',
  /** Internal whitespace */
  withSpaceInside: 'abc 12345',
  /** Persian digits — non-ASCII */
  persianDigits: '۱۲۳۴۵۶۷۸',
  /** Persian letters — non-ASCII */
  persianLetters: 'رمزعبور1234',
} as const;

/** Flat arrays for it.each() tables */
export const VALID_PASSWORD_LIST = Object.entries(VALID_PASSWORDS).map(
  ([label, password]) => ({ label, password })
);

export const INVALID_PASSWORD_LIST = Object.entries(INVALID_PASSWORDS).map(
  ([label, password]) => ({ label, password })
);
