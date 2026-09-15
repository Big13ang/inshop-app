import {
  parseImageHeader,
  parseExifOrientation,
  isVP8XWebP,
  isAnimatedWebP,
  detectVideoFormat,
} from '../headerParser';
import {
  createMockJpegBuffer,
  createMockPngBuffer,
  createMockWebpBuffer,
  createMockIsoBrandBuffer,
  toArrayBuffer,
} from './fixtures/imageBuffers';

describe('headerParser - parseImageHeader', () => {
  describe('JPEG parsing', () => {
    it('parses valid JPEG dimensions without EXIF orientation', () => {
      const buf = createMockJpegBuffer(1200, 1080);
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.format).toBe('jpeg');
        expect(res.value.width).toBe(1200);
        expect(res.value.height).toBe(1080);
        expect(res.value.animated).toBeUndefined();
      }
    });

    it('keeps original dimensions for normal EXIF orientation (1-4)', () => {
      const buf = createMockJpegBuffer(1600, 1200, 1);
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.width).toBe(1600);
        expect(res.value.height).toBe(1200);
      }
    });

    it('transposes width and height for rotated EXIF orientations (5-8)', () => {
      // Input 1600w x 1200h with orientation 6 (90° CW) -> Effective 1200w x 1600h
      const bufOrientation6 = createMockJpegBuffer(1600, 1200, 6);
      const res6 = parseImageHeader(bufOrientation6);

      expect(res6.ok).toBe(true);
      if (res6.ok) {
        expect(res6.value.width).toBe(1200);
        expect(res6.value.height).toBe(1600);
      }

      // Orientation 8 (270° CW) -> Effective transposed dimensions
      const bufOrientation8 = createMockJpegBuffer(1400, 900, 8);
      const res8 = parseImageHeader(bufOrientation8);

      expect(res8.ok).toBe(true);
      if (res8.ok) {
        expect(res8.value.width).toBe(900);
        expect(res8.value.height).toBe(1400);
      }
    });

    it('detects corrupt marker length < 2 in JPEG', () => {
      // SOI (2 bytes) + APP0 marker with corrupt length 0
      const corruptBuf = toArrayBuffer(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x01]));
      const res = parseImageHeader(corruptBuf);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('corrupt_marker');
      }
    });

    it('detects excessive JPEG markers loop (> 500 markers)', () => {
      // SOI + 505 valid empty markers (FF FE with length 2)
      const parts: Buffer[] = [Buffer.from([0xFF, 0xD8])];
      for (let i = 0; i < 505; i++) {
        parts.push(Buffer.from([0xFF, 0xFE, 0x00, 0x02]));
      }
      const excessiveBuf = toArrayBuffer(Buffer.concat(parts));
      const res = parseImageHeader(excessiveBuf);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('corrupt_marker');
      }
    });
  });

  describe('PNG parsing', () => {
    it('parses valid PNG dimensions', () => {
      const buf = createMockPngBuffer(1920, 1080);
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.format).toBe('png');
        expect(res.value.width).toBe(1920);
        expect(res.value.height).toBe(1080);
      }
    });
  });

  describe('WebP parsing', () => {
    it('parses static WebP dimensions with animated flag false', () => {
      const buf = createMockWebpBuffer(1280, 1280, false);
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.format).toBe('webp');
        expect(res.value.width).toBe(1280);
        expect(res.value.height).toBe(1280);
        expect(res.value.animated).toBe(false);
      }
    });

    it('detects animated WebP and sets animated flag true', () => {
      const buf = createMockWebpBuffer(1100, 1100, true);
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.format).toBe('webp');
        expect(res.value.width).toBe(1100);
        expect(res.value.height).toBe(1100);
        expect(res.value.animated).toBe(true);
      }
    });
  });

  describe('ISO Brand Detection (HEIC, AVIF)', () => {
    it('detects HEIC format and returns fallback dimensions 0x0', () => {
      const buf = createMockIsoBrandBuffer('heic');
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.format).toBe('heic');
        expect(res.value.width).toBe(0);
        expect(res.value.height).toBe(0);
      }
    });

    it('detects AVIF format and returns fallback dimensions 0x0', () => {
      const buf = createMockIsoBrandBuffer('avif');
      const res = parseImageHeader(buf);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.format).toBe('avif');
        expect(res.value.width).toBe(0);
        expect(res.value.height).toBe(0);
      }
    });
  });

  describe('Error handling & Malformed buffers', () => {
    it('returns unknown_format for buffer smaller than 4 bytes', () => {
      const tinyBuf = new Uint8Array([0xFF, 0xD8]).buffer;
      const res = parseImageHeader(tinyBuf);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('unknown_format');
      }
    });

    it('returns unknown_format for non-image binary', () => {
      const textBuf = Buffer.from('This is a plain text file, not an image!').buffer;
      const res = parseImageHeader(textBuf);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('unknown_format');
      }
    });
  });
});

describe('headerParser - parseExifOrientation', () => {
  it('returns null for short buffer < 4 bytes', () => {
    const res = parseExifOrientation(new ArrayBuffer(2));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBeNull();
  });

  it('returns null for JPEG without APP1 segment', () => {
    const buf = createMockJpegBuffer(1080, 1080);
    const res = parseExifOrientation(buf);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBeNull();
  });

  it('correctly extracts orientation value 6 from APP1 Exif', () => {
    const buf = createMockJpegBuffer(1080, 1080, 6);
    const res = parseExifOrientation(buf);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(6);
  });
});

describe('headerParser - WebP helper functions', () => {
  it('isVP8XWebP returns true for VP8X and false for short or other buffers', () => {
    const vp8xBuf = createMockWebpBuffer(1080, 1080);
    expect(isVP8XWebP(vp8xBuf)).toBe(true);

    expect(isVP8XWebP(new ArrayBuffer(10))).toBe(false);
    expect(isVP8XWebP(createMockPngBuffer(1080, 1080))).toBe(false);
  });

  it('isAnimatedWebP checks bit 1 in VP8X flags', () => {
    const staticWebp = createMockWebpBuffer(1080, 1080, false);
    const animatedWebp = createMockWebpBuffer(1080, 1080, true);

    expect(isAnimatedWebP(staticWebp)).toBe(false);
    expect(isAnimatedWebP(animatedWebp)).toBe(true);
    expect(isAnimatedWebP(new ArrayBuffer(10))).toBe(false);
  });
});

describe('headerParser - detectVideoFormat', () => {
  it('detects MP4 from ftyp brand', () => {
    const buf = createMockIsoBrandBuffer('mp41');
    expect(detectVideoFormat(buf)).toBe('mp4');
  });

  it('detects MOV from qt brand', () => {
    const buf = createMockIsoBrandBuffer('qt  ');
    expect(detectVideoFormat(buf)).toBe('mov');
  });

  it('detects WebM from EBML signature', () => {
    const buf = Buffer.alloc(10);
    buf.writeUInt32BE(0x1A45DFA3, 0);
    expect(detectVideoFormat(buf.buffer)).toBe('webm');
  });

  it('returns null for non-video buffer', () => {
    const buf = createMockPngBuffer(1080, 1080);
    expect(detectVideoFormat(buf)).toBeNull();
  });
});
