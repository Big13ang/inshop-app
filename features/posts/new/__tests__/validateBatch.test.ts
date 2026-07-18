import { validateBatch } from '../services/validateBatch';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

// ── helpers ───────────────────────────────────────────────────────────────────

const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 0x49, 0x48, 0x44, 0x52, 0, 0, 3, 0x20, 0, 0, 3, 0x20]); // 800x800
const JPEG_HEADER = new Uint8Array([0xFF, 0xD8, 0xFF, 0xC0, 0, 0x0B, 8, 3, 0x20, 3, 0x20, 3, 0, 0, 0, 0]); // 800x800
const WEBP_HEADER = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, 0, 0, 0, 0x9D, 1, 0x2A, 0x20, 3, 0x20, 3]); // 800x800
const HEIC_HEADER = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0]);
const GIF_HEADER = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const MP4_HEADER = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x31, 0, 0, 0, 0]);

const jpeg = (name = 'a.jpg') => new File([JPEG_HEADER], name, { type: 'image/jpeg' });
const png  = (name = 'a.png') => new File([PNG_HEADER], name, { type: 'image/png'  });
const webp = (name = 'a.webp') => new File([WEBP_HEADER], name, { type: 'image/webp' });
const heic = (name = 'a.heic') => new File([HEIC_HEADER], name, { type: 'image/heic' });
const gif  = (name = 'a.gif')  => new File([GIF_HEADER], name, { type: 'image/gif'  });
const mp4  = (name = 'a.mp4')  => new File([MP4_HEADER], name, { type: 'video/mp4' });

const huge = () => {
  const size = 11 * 1024 * 1024;
  const buf = new Uint8Array(size);
  buf.set(JPEG_HEADER, 0);
  return new File([buf], 'big.jpg', { type: 'image/jpeg' });
};

// ── validateBatch ─────────────────────────────────────────────────────────────

describe('validateBatch', () => {
  describe('valid images pass through', () => {
    it('accepts JPEG', async () => {
      const { valid, rejected } = await validateBatch([jpeg()]);
      expect(valid).toHaveLength(1);
      expect(rejected).toHaveLength(0);
    });

    it('accepts PNG', async () => {
      const { valid } = await validateBatch([png()]);
      expect(valid).toHaveLength(1);
    });

    it('accepts WebP', async () => {
      const { valid } = await validateBatch([webp()]);
      expect(valid).toHaveLength(1);
    });
  });

  describe('invalid MIME type is rejected', () => {
    it('rejects HEIC with a non-empty reason', async () => {
      const file = heic();
      const { valid, rejected } = await validateBatch([file]);
      expect(valid).toHaveLength(0);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].file).toBe(file);
      expect(rejected[0].reason.length).toBeGreaterThan(0);
      expect(rejected[0].code).toBe('heic_not_supported');
    });

    it('rejects GIF', async () => {
      const { rejected } = await validateBatch([gif()]);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].code).toBe('invalid_format');
    });
  });

  it('rejects a file over 10 MB', async () => {
    const { rejected } = await validateBatch([huge()]);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.length).toBeGreaterThan(0);
    expect(rejected[0].code).toBe('file_too_large');
  });

  it('separates valid from invalid in the same batch', async () => {
    const good = jpeg();
    const bad  = heic();
    const { valid, rejected } = await validateBatch([good, bad]);
    expect(valid).toContain(good);
    expect(rejected.map(r => r.file)).toContain(bad);
  });

  it('returns empty arrays for an empty input', async () => {
    const { valid, rejected } = await validateBatch([]);
    expect(valid).toHaveLength(0);
    expect(rejected).toHaveLength(0);
  });

  it('preserves the order of valid files', async () => {
    const files = [jpeg('1.jpg'), png('2.png'), webp('3.webp')];
    const { valid } = await validateBatch(files);
    expect(valid).toEqual(files);
  });

  describe('video kind', () => {
    it('accepts a valid MP4 using the video rules', async () => {
      const { valid, rejected } = await validateBatch([mp4()], 'video');
      expect(valid).toHaveLength(1);
      expect(rejected).toHaveLength(0);
    });

    it('rejects an image MIME type when validating as video', async () => {
      const { rejected } = await validateBatch([jpeg()], 'video');
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBe(ERROR_MESSAGES.upload.videoFormatLimit);
      expect(rejected[0].code).toBe('invalid_format');
    });
  });

  describe('cancellation', () => {
    it('returns empty arrays when signal is aborted before starting', async () => {
      const controller = new AbortController();
      controller.abort();
      const { valid, rejected } = await validateBatch([jpeg()], 'image', controller.signal);
      expect(valid).toHaveLength(0);
      expect(rejected).toHaveLength(0);
    });
  });
});
