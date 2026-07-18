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

/**
 * Extracts the server media ID from an uploaded URL and formats it to UUID.
 * Falls back to `fallbackId` when `uploadedUrl` is absent.
 *
 * Consolidates the duplicated extraction logic that previously existed in
 * useMediaUpload.removeItem and usePostFlow.handleNext.
 */
export function extractMediaId(
  uploadedUrl: string | null | undefined,
  fallbackId: string,
): string {
  const raw = uploadedUrl
    ? uploadedUrl.substring(uploadedUrl.lastIndexOf('/') + 1)
    : fallbackId;
  return formatToUUID(raw);
}
