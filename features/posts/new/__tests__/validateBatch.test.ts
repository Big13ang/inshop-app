import { validateBatch } from '../services/validateBatch';

// ── helpers ───────────────────────────────────────────────────────────────────

const jpeg = (name = 'a.jpg') => new File(['x'], name, { type: 'image/jpeg' });
const png  = (name = 'a.png') => new File(['x'], name, { type: 'image/png'  });
const webp = (name = 'a.webp') => new File(['x'], name, { type: 'image/webp' });
const heic = (name = 'a.heic') => new File(['x'], name, { type: 'image/heic' });
const gif  = (name = 'a.gif')  => new File(['x'], name, { type: 'image/gif'  });
const huge = () => {
  const buf = new ArrayBuffer(11 * 1024 * 1024); // 11 MB
  return new File([buf], 'big.jpg', { type: 'image/jpeg' });
};

// ── validateBatch ─────────────────────────────────────────────────────────────

describe('validateBatch', () => {
  describe('valid images pass through', () => {
    it('accepts JPEG', () => {
      const { valid, rejected } = validateBatch([jpeg()]);
      expect(valid).toHaveLength(1);
      expect(rejected).toHaveLength(0);
    });

    it('accepts PNG', () => {
      const { valid } = validateBatch([png()]);
      expect(valid).toHaveLength(1);
    });

    it('accepts WebP', () => {
      const { valid } = validateBatch([webp()]);
      expect(valid).toHaveLength(1);
    });
  });

  describe('invalid MIME type is rejected', () => {
    it('rejects HEIC with a non-empty reason', () => {
      const file = heic();
      const { valid, rejected } = validateBatch([file]);
      expect(valid).toHaveLength(0);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].file).toBe(file);
      expect(rejected[0].reason.length).toBeGreaterThan(0);
    });

    it('rejects GIF', () => {
      const { rejected } = validateBatch([gif()]);
      expect(rejected).toHaveLength(1);
    });
  });

  it('rejects a file over 10 MB', () => {
    const { rejected } = validateBatch([huge()]);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.length).toBeGreaterThan(0);
  });

  it('separates valid from invalid in the same batch', () => {
    const good = jpeg();
    const bad  = heic();
    const { valid, rejected } = validateBatch([good, bad]);
    expect(valid).toContain(good);
    expect(rejected.map(r => r.file)).toContain(bad);
  });

  it('returns empty arrays for an empty input', () => {
    const { valid, rejected } = validateBatch([]);
    expect(valid).toHaveLength(0);
    expect(rejected).toHaveLength(0);
  });

  it('preserves the order of valid files', () => {
    const files = [jpeg('1.jpg'), png('2.png'), webp('3.webp')];
    const { valid } = validateBatch(files);
    expect(valid).toEqual(files);
  });

  describe('video kind', () => {
    const mp4 = (name = 'a.mp4') => new File(['x'], name, { type: 'video/mp4' });

    it('accepts a valid MP4 using the video rules', () => {
      const { valid, rejected } = validateBatch([mp4()], 'video');
      expect(valid).toHaveLength(1);
      expect(rejected).toHaveLength(0);
    });

    it('rejects an image MIME type when validating as video', () => {
      const { rejected } = validateBatch([jpeg()], 'video');
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toContain('ویدیو');
    });
  });
});
