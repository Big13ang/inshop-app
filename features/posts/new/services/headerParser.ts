import { Result } from '@/lib/utils/result';
import { imageDimensionsFromData } from 'image-dimensions';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'heic' | 'avif';

export interface ParsedHeader {
  format: ImageFormat;
  width: number;
  height: number;
  animated?: boolean;   // WebP VP8X animation flag
}

export type ParseError =
  | { code: 'unknown_format' }
  | { code: 'truncated_header'; format?: ImageFormat }
  | { code: 'corrupt_marker'; detail: string };

/**
 * Parses EXIF orientation tag (0x0112) from a JPEG ArrayBuffer.
 * Returns the orientation value (1-8) or null if not found/invalid.
 */
export function parseExifOrientation(buffer: ArrayBuffer): Result<number | null, ParseError> {
  if (buffer.byteLength < 4) return Result.ok(null);
  const view = new DataView(buffer);

  // Must start with JPEG SOI (FFD8)
  if (view.getUint16(0, false) !== 0xFFD8) return Result.ok(null);

  let offset = 2;
  const maxBytes = buffer.byteLength;
  let iterations = 0;

  while (offset < maxBytes) {
    if (iterations++ > 500) {
      return Result.err({ code: 'corrupt_marker', detail: 'Too many JPEG markers' });
    }
    if (offset + 2 > maxBytes) break;
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xFFE1) {
      // APP1 segment (contains EXIF)
      if (offset + 2 > maxBytes) break;
      const segmentLength = view.getUint16(offset, false);
      if (segmentLength < 2) {
        return Result.err({ code: 'corrupt_marker', detail: `Invalid JPEG marker length ${segmentLength}` });
      }
      const app1End = offset + segmentLength;

      // Ensure segment length is valid and fits within buffer
      if (app1End > maxBytes) break;

      // Exif header: "Exif\0\0" (0x457869660000) at offset + 2
      const exifHeaderOffset = offset + 2;
      if (exifHeaderOffset + 6 > maxBytes) break;

      const isExifHeader =
        view.getUint32(exifHeaderOffset) === 0x45786966 && // "Exif"
        view.getUint16(exifHeaderOffset + 4) === 0x0000;    // "\0\0"

      if (!isExifHeader) {
        offset += segmentLength;
        continue;
      }

      // TIFF Header starts at exifHeaderOffset + 6
      const tiffOffset = exifHeaderOffset + 6;
      if (tiffOffset + 8 > maxBytes) break;

      const byteOrder = view.getUint16(tiffOffset);
      const littleEndian = byteOrder === 0x4949; // "II" (Intel / Little Endian)
      if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) {
        break;
      }

      if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
        break;
      }

      const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
      let ifdOffset = tiffOffset + firstIfdOffset;

      if (ifdOffset + 2 > app1End) break;
      const numEntries = view.getUint16(ifdOffset, littleEndian);
      ifdOffset += 2;

      for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdOffset + i * 12;
        if (entryOffset + 12 > app1End) break;

        const tag = view.getUint16(entryOffset, littleEndian);
        // Orientation tag is 0x0112
        if (tag === 0x0112) {
          const type = view.getUint16(entryOffset + 2, littleEndian);
          const count = view.getUint32(entryOffset + 4, littleEndian);

          // Type 3 is SHORT (uint16)
          if (type === 3 && count === 1) {
            return Result.ok(view.getUint16(entryOffset + 8, littleEndian));
          }
        }
      }
      break; // Found APP1, finished parsing
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break;
    } else {
      if (offset + 2 > maxBytes) break;
      const length = view.getUint16(offset, false);
      if (length < 2) {
        return Result.err({ code: 'corrupt_marker', detail: `Invalid JPEG marker length ${length}` });
      }
      offset += length;
    }
  }

  return Result.ok(null);
}

/**
 * Returns true when the WebP file uses the VP8X extended container.
 * Only VP8X WebPs can carry animation or alpha — VP8 and VP8L are always static.
 */
export function isVP8XWebP(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 16) return false;
  const view = new DataView(buffer);
  if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57454250) {
    return false;
  }
  return (
    view.getUint8(12) === 0x56 && // 'V'
    view.getUint8(13) === 0x50 && // 'P'
    view.getUint8(14) === 0x38 && // '8'
    view.getUint8(15) === 0x58    // 'X'
  );
}

/**
 * Checks if a WebP VP8X file has the animation flag set.
 * Only call this after confirming isVP8XWebP(buffer) === true.
 */
export function isAnimatedWebP(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 21) return false;
  const view = new DataView(buffer);

  // Check RIFF and WEBP signatures
  if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57454250) {
    return false;
  }

  // Check for VP8X sub-chunk type at bytes 12-15
  const subchunk = String.fromCharCode(
    view.getUint8(12),
    view.getUint8(13),
    view.getUint8(14),
    view.getUint8(15)
  );

  if (subchunk === 'VP8X') {
    const flags = view.getUint8(20);
    return (flags & 0x02) !== 0; // Bit 1 is animation flag
  }

  return false;
}

/**
 * Detects brand headers for ISO base media files (HEIC/AVIF/MP4/MOV).
 */
function detectIsoBrand(buffer: ArrayBuffer): 'heic' | 'avif' | 'mp4' | 'mov' | null {
  if (buffer.byteLength < 12) return null;
  const view = new DataView(buffer);
  if (view.getUint32(4) !== 0x66747970) return null; // "ftyp"

  const brandBytes = [view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)];
  const brand = String.fromCharCode(...brandBytes);

  if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) {
    return 'heic';
  }
  if (['avif', 'avis'].includes(brand)) {
    return 'avif';
  }
  if (['mp41', 'mp42', 'isom', 'iso2', 'dash'].includes(brand)) {
    return 'mp4';
  }
  if (['qt  '].includes(brand)) {
    return 'mov';
  }
  return null;
}

/**
 * Parses image header format and dimensions.
 */
export function parseImageHeader(buffer: ArrayBuffer): Result<ParsedHeader, ParseError> {
  if (buffer.byteLength < 4) {
    return Result.err({ code: 'unknown_format' });
  }

  const view = new DataView(buffer);
  const first16 = view.getUint16(0);

  // 1. Check format by magic bytes/brands to establish a fallback format
  let detectedFormat: ImageFormat | null = null;
  if (first16 === 0xFFD8) {
    detectedFormat = 'jpeg';
  } else if (
    buffer.byteLength >= 8 &&
    view.getUint32(0) === 0x89504E47 &&
    view.getUint32(4) === 0x0D0A1A0A
  ) {
    detectedFormat = 'png';
  } else if (
    buffer.byteLength >= 12 &&
    view.getUint32(0) === 0x52494646 &&
    view.getUint32(8) === 0x57454250
  ) {
    detectedFormat = 'webp';
  } else {
    const brand = detectIsoBrand(buffer);
    if (brand === 'heic') detectedFormat = 'heic';
    else if (brand === 'avif') detectedFormat = 'avif';
  }

  if (!detectedFormat) {
    return Result.err({ code: 'unknown_format' });
  }

  // Check orientation first for JPEG so we capture corrupt_marker before dimensions checks
  let jpegOrientation: number | null = null;
  if (detectedFormat === 'jpeg') {
    const orientationResult = parseExifOrientation(buffer);
    if (!orientationResult.ok) {
      return Result.err(orientationResult.error);
    }
    jpegOrientation = orientationResult.value;
  }

  // 2. Delegate raw dimension parsing to image-dimensions package
  const uint8 = new Uint8Array(buffer);
  const dims = imageDimensionsFromData(uint8);

  if (!dims) {
    // HEIC or AVIF can return 0x0 dimensions as a fallback if headers are truncated,
    // since they are rejected by format policy anyway.
    if (detectedFormat === 'heic' || detectedFormat === 'avif') {
      return Result.ok({ format: detectedFormat, width: 0, height: 0 });
    }
    return Result.err({ code: 'truncated_header', format: detectedFormat });
  }

  // Ensure package type matches supported ImageFormat
  const allowedFormats: string[] = ['jpeg', 'png', 'webp', 'heic', 'avif'];
  if (!allowedFormats.includes(dims.type)) {
    return Result.err({ code: 'unknown_format' });
  }

  const format = dims.type as ImageFormat;
  let width = dims.width;
  let height = dims.height;

  // 3. Handle EXIF orientation swap for JPEGs
  if (format === 'jpeg' && jpegOrientation) {
    if (jpegOrientation >= 5 && jpegOrientation <= 8) {
      const temp = width;
      width = height;
      height = temp;
    }
  }

  // 4. Check for animated WebPs — only VP8X sub-format can carry animation.
  //    VP8 / VP8L are inherently static; leave animated undefined for them.
  const result: ParsedHeader = { format, width, height };
  if (format === 'webp' && isVP8XWebP(buffer)) {
    result.animated = isAnimatedWebP(buffer);
  }

  return Result.ok(result);
}

/**
 * Detects format for videos.
 */
export function detectVideoFormat(buffer: ArrayBuffer): 'mp4' | 'webm' | 'mov' | null {
  const brand = detectIsoBrand(buffer);
  if (brand === 'mp4') return 'mp4';
  if (brand === 'mov') return 'mov';

  if (buffer.byteLength >= 4) {
    const view = new DataView(buffer);
    if (view.getUint32(0) === 0x1A45DFA3) {
      return 'webm';
    }
  }
  return null;
}
