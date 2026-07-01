/**
 * Unit tests — otpLogic (pure OTP helper functions)
 *
 * Layer:   Unit (no DOM, no React)
 * Runner:  Jest
 * Pattern: Black-box — test public API, never internals
 *
 * Coverage mandate:
 *   ✅ extractDigits — Persian/Arabic conversion, non-digit stripping, length capping
 *   ✅ fillSlots — short/exact/over-length digit strings
 *   ✅ areAllOtpSlotsFilled — all filled, partial, empty, wrong-length
 *   ✅ setSlot — correct update, immutability, boundary indices
 */

import {
  OTP_LENGTH,
  extractDigits,
  fillSlots,
  areAllOtpSlotsFilled,
  setSlot,
} from '../hooks/otpLogic';

// ─── extractDigits ──────────────────────────────────────────────────────────

describe('extractDigits', () => {
  it('extracts English digits from a plain numeric string', () => {
    expect(extractDigits('1234')).toBe('1234');
  });

  it('converts Persian digits to English', () => {
    expect(extractDigits('۱۲۳۴')).toBe('1234');
  });

  it('converts Arabic digits to English', () => {
    expect(extractDigits('١٢٣٤')).toBe('1234');
  });

  it('converts mixed Persian/Arabic/English digits', () => {
    expect(extractDigits('۱2٣4')).toBe('1234');
  });

  it('strips non-digit characters', () => {
    expect(extractDigits('a1b2c3d4')).toBe('1234');
  });

  it('strips non-digit characters from Persian input', () => {
    expect(extractDigits('abc۱۲۳۴xyz')).toBe('1234');
  });

  it('returns empty string for all-non-digit input', () => {
    expect(extractDigits('abcdef')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(extractDigits('')).toBe('');
  });

  it('returns exactly OTP_LENGTH digits for exact-length input', () => {
    const result = extractDigits('1234');
    expect(result).toBe('1234');
    expect(result.length).toBe(OTP_LENGTH);
  });

  it('truncates to OTP_LENGTH when input has more digits', () => {
    const result = extractDigits('123456789');
    expect(result).toBe('1234');
    expect(result.length).toBe(OTP_LENGTH);
  });

  it('returns fewer than OTP_LENGTH digits for short input', () => {
    expect(extractDigits('12')).toBe('12');
  });

  it('handles whitespace-only input', () => {
    expect(extractDigits('   ')).toBe('');
  });

  it('handles special characters mixed with digits', () => {
    expect(extractDigits('1#2$3%4')).toBe('1234');
  });
});

// ─── fillSlots ──────────────────────────────────────────────────────────────

describe('fillSlots', () => {
  it('spreads a full-length digit string into individual slots', () => {
    expect(fillSlots('1234')).toEqual(['1', '2', '3', '4']);
  });

  it('pads with empty strings when digit string is shorter than OTP_LENGTH', () => {
    expect(fillSlots('12')).toEqual(['1', '2', '', '']);
  });

  it('pads with empty strings for single digit', () => {
    expect(fillSlots('9')).toEqual(['9', '', '', '']);
  });

  it('returns all empty strings for empty input', () => {
    expect(fillSlots('')).toEqual(['', '', '', '']);
  });

  it('truncates to OTP_LENGTH when digit string is longer', () => {
    const result = fillSlots('123456');
    expect(result).toHaveLength(OTP_LENGTH);
    expect(result).toEqual(['1', '2', '3', '4']);
  });

  it('always returns an array of exactly OTP_LENGTH', () => {
    expect(fillSlots('')).toHaveLength(OTP_LENGTH);
    expect(fillSlots('1')).toHaveLength(OTP_LENGTH);
    expect(fillSlots('1234')).toHaveLength(OTP_LENGTH);
    expect(fillSlots('999999')).toHaveLength(OTP_LENGTH);
  });
});

// ─── areAllOtpSlotsFilled ───────────────────────────────────────────────────

describe('areAllOtpSlotsFilled', () => {
  it('returns true when all slots are filled', () => {
    expect(areAllOtpSlotsFilled(['1', '2', '3', '4'])).toBe(true);
  });

  it('returns false when one slot is empty', () => {
    expect(areAllOtpSlotsFilled(['1', '2', '', '4'])).toBe(false);
  });

  it('returns false when all slots are empty', () => {
    expect(areAllOtpSlotsFilled(['', '', '', ''])).toBe(false);
  });

  it('returns false when last slot is empty', () => {
    expect(areAllOtpSlotsFilled(['1', '2', '3', ''])).toBe(false);
  });

  it('returns false when first slot is empty', () => {
    expect(areAllOtpSlotsFilled(['', '2', '3', '4'])).toBe(false);
  });

  it('returns false when array is shorter than OTP_LENGTH', () => {
    expect(areAllOtpSlotsFilled(['1', '2', '3'])).toBe(false);
  });

  it('returns false when array is longer than OTP_LENGTH', () => {
    expect(areAllOtpSlotsFilled(['1', '2', '3', '4', '5'])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(areAllOtpSlotsFilled([])).toBe(false);
  });
});

// ─── setSlot ────────────────────────────────────────────────────────────────

describe('setSlot', () => {
  const base = ['', '', '', ''];

  it('sets a digit at the specified index', () => {
    expect(setSlot(base, 0, '5')).toEqual(['5', '', '', '']);
  });

  it('sets a digit at the last index', () => {
    expect(setSlot(base, 3, '9')).toEqual(['', '', '', '9']);
  });

  it('replaces an existing digit at the specified index', () => {
    const filled = ['1', '2', '3', '4'];
    expect(setSlot(filled, 1, '8')).toEqual(['1', '8', '3', '4']);
  });

  it('clears a slot when given an empty string', () => {
    const filled = ['1', '2', '3', '4'];
    expect(setSlot(filled, 2, '')).toEqual(['1', '2', '', '4']);
  });

  it('does NOT mutate the original array (immutable)', () => {
    const original = ['1', '2', '3', '4'];
    const originalCopy = [...original];
    setSlot(original, 0, '9');
    expect(original).toEqual(originalCopy);
  });

  it('returns a new array reference', () => {
    const original = ['1', '2', '3', '4'];
    const result = setSlot(original, 0, '9');
    expect(result).not.toBe(original);
  });

  it('preserves other slots when setting index 0', () => {
    const slots = ['1', '2', '3', '4'];
    const result = setSlot(slots, 0, '0');
    expect(result[1]).toBe('2');
    expect(result[2]).toBe('3');
    expect(result[3]).toBe('4');
  });
});
