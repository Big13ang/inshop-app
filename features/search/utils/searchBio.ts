/**
 * Strips emoji pictographic characters and collapses spaces from bio text.
 */
export function removeEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates bio text to maxLength with an ellipsis if it exceeds the limit.
 */
export function formatBioWithEllipsis(bio?: string, maxLength = 60): string {
  if (!bio) return '';

  const clean = removeEmojis(bio);
  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength).trim()}...`;
}

