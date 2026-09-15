import {
  validateOne,
  validateImage,
  registerValidator,
  REJECTION_CODES,
} from '../validateOne';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import {
  createMockJpegBuffer,
  createMockPngBuffer,
  createMockWebpBuffer,
  createMockIsoBrandBuffer,
  createMockFile,
} from './fixtures/imageBuffers';

describe('validateOne & validateImage', () => {
  describe('File Size Rules', () => {
    it('accepts file within 10MB limit', async () => {
      const buf = createMockJpegBuffer(1200, 1200);
      const file = createMockFile('valid-size.jpg', buf, 'image/jpeg', 5 * 1024 * 1024);

      const rejection = await validateOne(file);
      expect(rejection).toBeNull();
    });

    it('accepts file at exact 10MB boundary', async () => {
      const buf = createMockJpegBuffer(1200, 1200);
      const file = createMockFile('exact-10mb.jpg', buf, 'image/jpeg', 10 * 1024 * 1024);

      const rejection = await validateOne(file);
      expect(rejection).toBeNull();
    });

    it('rejects file exceeding 10MB limit by 1 byte', async () => {
      const buf = createMockJpegBuffer(1200, 1200);
      const file = createMockFile('too-large.jpg', buf, 'image/jpeg', 10 * 1024 * 1024 + 1);

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.FILE_TOO_LARGE);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.imageSizeLimit);
    });
  });

  describe('Dimension Requirements (>= 1080x1080)', () => {
    it('accepts image meeting exact 1080x1080 resolution', async () => {
      const buf = createMockPngBuffer(1080, 1080);
      const file = createMockFile('boundary-1080.png', buf, 'image/png');

      const rejection = await validateOne(file);
      expect(rejection).toBeNull();
    });

    it('rejects image with width below 1080px', async () => {
      const buf = createMockPngBuffer(1079, 1200);
      const file = createMockFile('small-width.png', buf, 'image/png');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.RESOLUTION_TOO_LOW);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.resolutionTooSmall);
    });

    it('rejects image with height below 1080px', async () => {
      const buf = createMockJpegBuffer(1920, 1079);
      const file = createMockFile('small-height.jpg', buf, 'image/jpeg');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.RESOLUTION_TOO_LOW);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.resolutionTooSmall);
    });

    it('rejects rotated JPEG where EXIF orientation brings effective height below 1080px', async () => {
      // 1200w x 800h with orientation 6 -> effective 800w x 1200h (width < 1080)
      const buf = createMockJpegBuffer(1200, 800, 6);
      const file = createMockFile('rotated-too-small.jpg', buf, 'image/jpeg');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.RESOLUTION_TOO_LOW);
    });
  });

  describe('Format Policy & Codec Rules', () => {
    it('accepts valid static WebP', async () => {
      const buf = createMockWebpBuffer(1200, 1200, false);
      const file = createMockFile('static.webp', buf, 'image/webp');

      const rejection = await validateOne(file);
      expect(rejection).toBeNull();
    });

    it('rejects animated WebP files', async () => {
      const buf = createMockWebpBuffer(1200, 1200, true);
      const file = createMockFile('animated.webp', buf, 'image/webp');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.INVALID_FORMAT);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.animatedWebpNotAllowed);
    });

    it('rejects HEIC files with explicit unsupported message', async () => {
      const buf = createMockIsoBrandBuffer('heic');
      const file = createMockFile('photo.heic', buf, 'image/heic');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.HEIC_NOT_SUPPORTED);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.heicNotSupported);
    });

    it('rejects AVIF files with HEIC_NOT_SUPPORTED code', async () => {
      const buf = createMockIsoBrandBuffer('avif');
      const file = createMockFile('photo.avif', buf, 'image/avif');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.HEIC_NOT_SUPPORTED);
    });

    it('rejects non-image or disguised text files', async () => {
      const textBuf = Buffer.from('console.log("hello");').buffer;
      const file = createMockFile('script.jpg', textBuf, 'image/jpeg');

      const rejection = await validateOne(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.INVALID_FORMAT);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.imageFormatLimit);
    });
  });

  describe('Buffer Read Errors & Edge Cases', () => {
    it('handles file slice reading error gracefully', async () => {
      const file = new File([''], 'broken.jpg', { type: 'image/jpeg' });
      // Force file.slice().arrayBuffer() to fail
      jest.spyOn(file, 'slice').mockImplementation(() => {
        return {
          arrayBuffer: () => Promise.reject(new Error('Disk read error')),
        } as unknown as Blob;
      });

      const rejection = await validateImage(file);
      expect(rejection).not.toBeNull();
      expect(rejection?.code).toBe(REJECTION_CODES.INVALID_FORMAT);
      expect(rejection?.reason).toBe(ERROR_MESSAGES.upload.fileUnreadable);
    });

    it('returns null for falsy file or missing size property', async () => {
      // @ts-expect-error Testing invalid runtime input
      expect(await validateOne(null)).toBeNull();
      // @ts-expect-error Testing invalid runtime input
      expect(await validateOne(undefined)).toBeNull();
      // @ts-expect-error Testing invalid runtime input
      expect(await validateOne({})).toBeNull();
    });

    it('returns null when validator for kind is not registered', async () => {
      const buf = createMockJpegBuffer(1200, 1200);
      const file = createMockFile('file.xyz', buf);
      // @ts-expect-error Unregistered kind
      const result = await validateOne(file, 'unknown_kind');
      expect(result).toBeNull();
    });

    it('supports custom validator registration via registerValidator', async () => {
      const customValidator = jest.fn().mockResolvedValue(null);
      registerValidator('custom', customValidator);

      const buf = createMockJpegBuffer(1200, 1200);
      const file = createMockFile('custom.dat', buf);

      // @ts-expect-error Testing registered custom kind
      const result = await validateOne(file, 'custom');
      expect(result).toBeNull();
      expect(customValidator).toHaveBeenCalledWith(file);
    });
  });
});
