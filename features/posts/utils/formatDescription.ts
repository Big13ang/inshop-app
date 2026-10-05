/**
 * Normalizes post descriptions:
 * - Unescapes literal '\\n' and '\\r\\n' escape sequences (e.g., from raw JSON/escaped payloads)
 * - Normalizes Windows CRLF (\\r\\n) and classic Mac CR (\\r) to standard Unix LF (\\n)
 * - Trims leading and trailing whitespace while strictly preserving internal line breaks
 */
export function normalizePostDescription(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Extracts a concise, clean title from a post description for OpenGraph metadata and document title.
 */
export function extractPostTitle(description?: string | null): string | undefined {
  const normalized = normalizePostDescription(description);
  if (!normalized) return undefined;

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;

  // Find first meaningful line that isn't purely hashtags or emojis/symbols
  const candidate = lines.find((l) => !/^([#@\p{Emoji}\s]+)$/u.test(l)) || lines[0];
  const cleaned = candidate.replace(/^[•\-\*#\s]+/, '').trim();
  if (!cleaned) return undefined;

  if (cleaned.length <= 70) {
    return cleaned;
  }
  const slice = cleaned.slice(0, 67);
  const lastSpace = slice.lastIndexOf(' ');
  return `${lastSpace > 40 ? slice.slice(0, lastSpace) : slice}...`;
}

/**
 * Formats a clean, readable description for post OpenGraph & Twitter preview cards (max ~160 chars).
 */
export function formatPostMetaDescription(description?: string | null, shopName?: string | null): string {
  const normalized = normalizePostDescription(description);
  if (!normalized) {
    return shopName
      ? `مشاهده مشخصات و خرید آنلاین از ${shopName} در اینشاپ`
      : 'مشاهده مشخصات و خرید آنلاین این محصول در اینشاپ';
  }

  // Remove lines that are purely hashtags or pure symbols
  const cleanLines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^([#@\p{Emoji}\s]+)$/u.test(l));

  const text = (cleanLines.length > 0 ? cleanLines.join(' ') : normalized.replace(/\n+/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= 160) {
    return text;
  }
  const slice = text.slice(0, 157);
  const lastSpace = slice.lastIndexOf(' ');
  return `${lastSpace > 120 ? slice.slice(0, lastSpace) : slice}...`;
}

