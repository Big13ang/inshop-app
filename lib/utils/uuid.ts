let fallbackCounter = 0;

function getCrypto(): (Crypto & { randomUUID?: () => string }) | undefined {
  return globalThis.crypto as (Crypto & { randomUUID?: () => string }) | undefined;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

function createFallbackUuid(): string {
  fallbackCounter += 1;

  const randomA = Math.floor(Math.random() * 0x1_0000_0000)
    .toString(16)
    .padStart(8, '0');
  const timestamp = Date.now().toString(16).padStart(12, '0').slice(-12);
  const counter = fallbackCounter.toString(16).padStart(4, '0').slice(-4);

  return `${randomA}-${counter}-4000-8000-${timestamp}`;
}

export function createUuid(): string {
  const crypto = getCrypto();

  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return bytesToUuid(bytes);
  }

  return createFallbackUuid();
}

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
