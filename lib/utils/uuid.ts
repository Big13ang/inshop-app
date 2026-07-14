/**
 * Formats a 32-character hexadecimal string into a standard canonical hyphenated UUID (8-4-4-4-12).
 * If the string is already formatted or not 32 characters, returns it as-is.
 */
export function formatToUUID(hex: string): string {
  if (hex && hex.length === 32 && !hex.includes('-')) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return hex;
}
