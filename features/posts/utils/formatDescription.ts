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
