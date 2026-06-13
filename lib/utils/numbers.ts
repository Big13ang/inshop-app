/**
 * Converts Persian and Arabic digit characters in a string to standard English digits.
 *
 * @param str The input string potentially containing Persian or Arabic digits.
 * @returns The converted string with English digits.
 */
export function convertPersianArabicToEnglish(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (w) => String(w.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (w) => String(w.charCodeAt(0) - 1632));
}
