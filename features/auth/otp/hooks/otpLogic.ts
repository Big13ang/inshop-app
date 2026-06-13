// Pure functions — no React, no DOM. Safe to unit test directly.
import { convertPersianArabicToEnglish } from '@/lib/utils';

export const OTP_LENGTH = 4;


/** Strip non-digits and trim to OTP length. */
export function extractDigits(raw: string): string {
  const converted = convertPersianArabicToEnglish(raw);
  return converted.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

/** Spread a digit string across a fixed-length slots array. */
export function fillSlots(digits: string): string[] {
  return Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? '');
}

/** True when all slots are filled. */
export function areAllOtpSlotsFilled(slots: string[]): boolean {
  return slots.length === OTP_LENGTH && slots.every(Boolean);
}

/** Apply a single digit to one slot, returning the updated array. */
export function setSlot(slots: string[], index: number, digit: string): string[] {
  const next = [...slots];
  next[index] = digit;
  return next;
}
