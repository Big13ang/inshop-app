/**
 * In-memory binary buffer generators for image and media headers.
 * Used for testing binary parsing and validation without disk or network I/O.
 */

export function createMockJpegBuffer(
  width: number,
  height: number,
  orientation?: number
): ArrayBuffer {
  const parts: Buffer[] = [];

  // SOI (Start Of Image)
  parts.push(Buffer.from([0xFF, 0xD8]));

  if (orientation) {
    // APP1 segment with Exif header + TIFF payload
    const app1 = Buffer.alloc(32);
    app1[0] = 0xFF;
    app1[1] = 0xE1;
    app1.writeUInt16BE(30, 2); // Segment length (30 bytes)
    app1.write('Exif\0\0', 4); // Exif signature (6 bytes)

    // TIFF header at offset 10
    app1.write('II', 10); // Little endian
    app1.writeUInt16LE(0x002A, 12); // TIFF magic 42
    app1.writeUInt32LE(8, 14); // Offset to first IFD (8 bytes from TIFF header start)
    app1.writeUInt16LE(1, 18); // Number of IFD entries: 1

    // IFD Entry at offset 20 (12 bytes)
    app1.writeUInt16LE(0x0112, 20); // Tag 0x0112 (Orientation)
    app1.writeUInt16LE(3, 22); // Type 3 (SHORT)
    app1.writeUInt32LE(1, 24); // Count 1
    app1.writeUInt16LE(orientation, 28); // Orientation value (1-8)
    app1.writeUInt16LE(0, 30); // Padding

    parts.push(app1);
  }

  // SOF0 (Start Of Frame - Baseline DCT)
  const sof0 = Buffer.from([
    0xFF, 0xC0,
    0x00, 0x11, // Length = 17 bytes
    0x08, // Precision = 8 bits
    (height >> 8) & 0xFF, height & 0xFF,
    (width >> 8) & 0xFF, width & 0xFF,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, // 3 components (YCbCr)
  ]);
  parts.push(sof0);

  const combined = Buffer.concat(parts);
  return combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength);
}

export function createMockPngBuffer(width: number, height: number): ArrayBuffer {
  // PNG signature (8 bytes) + IHDR chunk (25 bytes)
  const buf = Buffer.alloc(33);

  // Signature
  buf.writeUInt8(0x89, 0);
  buf.write('PNG\r\n\x1a\n', 1);

  // IHDR chunk length = 13
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12);
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf.writeUInt8(8, 24); // Bit depth
  buf.writeUInt8(6, 25); // Color type RGBA
  buf.writeUInt8(0, 26); // Compression method
  buf.writeUInt8(0, 27); // Filter method
  buf.writeUInt8(0, 28); // Interlace method
  buf.writeUInt32BE(0, 29); // Mock CRC

  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function createMockWebpBuffer(
  width: number,
  height: number,
  animated = false
): ArrayBuffer {
  // RIFF (4) + size (4) + WEBP (4) + VP8X (4) + chunk_size 10 (4) + flags (4) + canvas_w (3) + canvas_h (3)
  const buf = Buffer.alloc(30);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(22, 4); // File size - 8
  buf.write('WEBP', 8);
  buf.write('VP8X', 12);
  buf.writeUInt32LE(10, 16); // VP8X chunk length = 10

  // Flags: bit 1 is animation (0x02)
  buf.writeUInt8(animated ? 0x02 : 0x00, 20);
  buf.writeUInt8(0, 21);
  buf.writeUInt8(0, 22);
  buf.writeUInt8(0, 23);

  // Canvas width minus one (24-bit LE)
  const wMinusOne = Math.max(0, width - 1);
  buf.writeUInt8(wMinusOne & 0xFF, 24);
  buf.writeUInt8((wMinusOne >> 8) & 0xFF, 25);
  buf.writeUInt8((wMinusOne >> 16) & 0xFF, 26);

  // Canvas height minus one (24-bit LE)
  const hMinusOne = Math.max(0, height - 1);
  buf.writeUInt8(hMinusOne & 0xFF, 27);
  buf.writeUInt8((hMinusOne >> 8) & 0xFF, 28);
  buf.writeUInt8((hMinusOne >> 16) & 0xFF, 29);

  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function createMockIsoBrandBuffer(brand: string): ArrayBuffer {
  const buf = Buffer.alloc(16);
  buf.writeUInt32BE(16, 0); // Box size = 16
  buf.write('ftyp', 4);
  buf.write(brand.padEnd(4, ' '), 8);
  buf.writeUInt32BE(0, 12); // Minor version

  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

export function createMockFile(
  name: string,
  buffer: ArrayBuffer,
  type = 'image/jpeg',
  overrideSize?: number
): File {
  const file = new File([buffer], name, { type });
  if (typeof overrideSize === 'number') {
    Object.defineProperty(file, 'size', {
      value: overrideSize,
      writable: false,
    });
  }
  return file;
}
