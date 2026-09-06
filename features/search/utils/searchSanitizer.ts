/**
 * Character maps for Persian and Arabic normalizations
 */
const ARABIC_YEH_REGEX = /[\u064A\u0649]/g;
const PERSIAN_YEH = '\u06CC';

const ARABIC_KAF_REGEX = /\u0643/g;
const PERSIAN_KAF = '\u06A9';

const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const DIGIT_REGEX = /[۰-۹٠-٩]/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ASCII control character stripping for sanitization
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F-\x9F]/g;
const HTML_TAGS_REGEX = /<[^>]*>/g;
const HTML_BRACKETS_REGEX = /[<>]/g;
const MULTI_SPACE_REGEX = /\s+/g;
const MULTI_ZWNJ_REGEX = /\u200C{2,}/g;

/**
 * Normalizes Persian/Arabic input characters, digits, and whitespace.
 */
export function normalizeSearchQuery(raw: string): string {
  if (!raw) return '';

  return raw
    .replace(ARABIC_YEH_REGEX, PERSIAN_YEH)
    .replace(ARABIC_KAF_REGEX, PERSIAN_KAF)
    .replace(DIGIT_REGEX, (d) => EASTERN_ARABIC_DIGITS[d] || d)
    .replace(MULTI_ZWNJ_REGEX, '\u200C')
    .replace(MULTI_SPACE_REGEX, ' ')
    .trim();
}

/**
 * Strips dangerous characters, control characters, and script/HTML injection patterns.
 */
export function sanitizeSearchQuery(raw: string): string {
  if (!raw) return '';

  return raw
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(HTML_TAGS_REGEX, '')
    .replace(HTML_BRACKETS_REGEX, '')
    .trim();
}

/**
 * Sanitizes and normalizes the search query in a single standard pipeline.
 */
export function cleanSearchQuery(raw: string): string {
  return normalizeSearchQuery(sanitizeSearchQuery(raw));
}
