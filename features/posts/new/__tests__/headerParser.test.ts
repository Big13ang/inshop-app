import { parseImageHeader, detectVideoFormat } from '../services/headerParser';

function hexToBuffer(hex: string): ArrayBuffer {
  const cleanHex = hex.replace(/\s+/g, '');
  const buffer = new ArrayBuffer(cleanHex.length / 2);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < cleanHex.length; i += 2) {
    view[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return buffer;
}

// ── Hex Fixtures ──────────────────────────────────────────────────────────────

const PNG_HEX = '89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52 00 00 03 20 00 00 02 58'; // 800x600

const WEBP_VP8_HEX = '52 49 46 46 00 00 00 00 57 45 42 50 56 50 38 20 00 00 00 00 00 00 00 9D 01 2A 20 03 58 02'; // 800x600

const WEBP_VP8L_HEX = '52 49 46 46 00 00 00 00 57 45 42 50 56 50 38 4C 00 00 00 00 2F 1F C3 95 00'; // 800x600

const WEBP_VP8X_STATIC_HEX = '52 49 46 46 00 00 00 00 57 45 42 50 56 50 38 58 00 00 00 00 00 00 00 00 1F 03 00 57 02 00'; // 800x600

const WEBP_VP8X_ANIM_HEX = '52 49 46 46 00 00 00 00 57 45 42 50 56 50 38 58 00 00 00 00 02 00 00 00 1F 03 00 57 02 00'; // 800x600, anim flag set

const JPEG_SOF0_HEX = 'FF D8 FF C0 00 0B 08 02 58 03 20 03 00 00 00 00'; // 800x600

const JPEG_ORIENTED_HEX =
  'FF D8 ' + // SOI
  'FF E1 00 1E 45 78 69 66 00 00 4D 4D 00 2A 00 00 00 08 00 01 01 12 00 03 00 00 00 01 00 06 00 00 ' + // APP1 Exif Orientation 6
  'FF C0 00 0B 08 02 58 03 20 03 00 00 00 00'; // SOF0 800x600

const JPEG_INFINITE_LOOP_HEX = 'FF D8 FF E1 00 00 00 00'; // Marker length 0

const PDF_HEX = '25 50 44 46 2D 31 2E 34'; // %PDF-1.4

const HEIC_HEX = '00 00 00 18 66 74 79 70 68 65 69 63 00 00 00 00'; // heic brand ftyp

const MP4_HEX = '00 00 00 18 66 74 79 70 6D 70 34 31 00 00 00 00'; // mp41 brand ftyp

const WEBM_HEX = '1A 45 DF A3 01 00 00 00';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('parseImageHeader', () => {
  jest.setTimeout(1000);

  it('parses valid PNG headers', () => {
    const res = parseImageHeader(hexToBuffer(PNG_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'png',
        width: 800,
        height: 600,
      });
    }
  });

  it('parses valid WebP VP8 headers', () => {
    const res = parseImageHeader(hexToBuffer(WEBP_VP8_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'webp',
        width: 800,
        height: 600,
      });
    }
  });

  it('parses valid WebP VP8L headers', () => {
    const res = parseImageHeader(hexToBuffer(WEBP_VP8L_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'webp',
        width: 800,
        height: 600,
      });
    }
  });

  it('parses valid WebP VP8X static headers', () => {
    const res = parseImageHeader(hexToBuffer(WEBP_VP8X_STATIC_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'webp',
        width: 800,
        height: 600,
        animated: false,
      });
    }
  });

  it('parses valid WebP VP8X animated headers and returns animated: true', () => {
    const res = parseImageHeader(hexToBuffer(WEBP_VP8X_ANIM_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'webp',
        width: 800,
        height: 600,
        animated: true,
      });
    }
  });

  it('parses valid JPEG SOF0 headers', () => {
    const res = parseImageHeader(hexToBuffer(JPEG_SOF0_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'jpeg',
        width: 800,
        height: 600,
      });
    }
  });

  it('parses JPEG with Exif orientation and returns dimensions', () => {
    const res = parseImageHeader(hexToBuffer(JPEG_ORIENTED_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        format: 'jpeg',
        width: 600,
        height: 800,
      });
    }
  });

  it('safely handles JPEG invalid markers and prevents infinite loops', () => {
    const res = parseImageHeader(hexToBuffer(JPEG_INFINITE_LOOP_HEX));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('corrupt_marker');
    }
  });

  it('recognizes HEIC format but does not extract dimensions', () => {
    const res = parseImageHeader(hexToBuffer(HEIC_HEX));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.format).toBe('heic');
    }
  });

  it('rejects unknown format (e.g. PDF)', () => {
    const res = parseImageHeader(hexToBuffer(PDF_HEX));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('unknown_format');
    }
  });
});

describe('detectVideoFormat', () => {
  it('detects MP4 from ftyp box', () => {
    const format = detectVideoFormat(hexToBuffer(MP4_HEX));
    expect(format).toBe('mp4');
  });

  it('detects WebM from EBML header', () => {
    const format = detectVideoFormat(hexToBuffer(WEBM_HEX));
    expect(format).toBe('webm');
  });

  it('returns null for non-video headers', () => {
    const format = detectVideoFormat(hexToBuffer(PNG_HEX));
    expect(format).toBeNull();
  });
});
