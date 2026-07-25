import { buildMediaItem } from '../services/uploadPipeline';

const jpg = (name = 'photo.jpg') => new File(['x'], name, { type: 'image/jpeg' });

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:local-url');
  Object.defineProperty(global.crypto, 'randomUUID', {
    value: jest.fn(() => 'test-uuid'),
    writable: true,
    configurable: true,
  });
});

describe('buildMediaItem', () => {
  it('sets status to pending and uploadProgress to 0', () => {
    const result = buildMediaItem(jpg());
    expect(result.status).toBe('pending');
    expect(result.uploadProgress).toBe(0);
  });

  it('preserves the File reference', () => {
    const file = jpg();
    expect(buildMediaItem(file).file).toBe(file);
  });

  it('defaults kind to image', () => {
    expect(buildMediaItem(jpg()).kind).toBe('image');
  });

  it('accepts video media kind', () => {
    const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    expect(buildMediaItem(video).kind).toBe('video');
  });

  it('generates a unique id via randomUUID', () => {
    const result = buildMediaItem(jpg());
    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(result.id).toBe('test-uuid');
  });

  it('returns a shape conforming to MediaItem', () => {
    const result = buildMediaItem(jpg());
    expect(result).toMatchObject({
      id: expect.any(String),
      serverMediaId: null,
      file: expect.any(File),
      status: 'pending',
      uploadProgress: 0,
      kind: 'image',
      isValid: false,
    });
  });
});
