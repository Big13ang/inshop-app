import { buildMediaItem } from '../services/buildMediaItem';

const jpg = (name = 'photo.jpg') => new File(['x'], name, { type: 'image/jpeg' });

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:local-url');
  global.crypto.randomUUID = jest.fn(() => 'test-uuid' as `${string}-${string}-${string}-${string}-${string}`);
});

describe('buildMediaItem', () => {
  it('sets status to queued and progress to 0', () => {
    const result = buildMediaItem(jpg());
    expect(result.status).toBe('queued');
    expect(result.progress).toBe(0);
  });

  it('preserves the file name', () => {
    expect(buildMediaItem(jpg('sunset.jpg')).name).toBe('sunset.jpg');
  });

  it('preserves the File reference', () => {
    const file = jpg();
    expect(buildMediaItem(file).file).toBe(file);
  });

  it('calls URL.createObjectURL and stores the result as localUrl', () => {
    const file = jpg();
    const result = buildMediaItem(file);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(result.localUrl).toBe('blob:local-url');
  });

  it('defaults mediaKind to image', () => {
    expect(buildMediaItem(jpg()).mediaKind).toBe('image');
  });

  it('accepts video mediaKind', () => {
    const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    expect(buildMediaItem(video, 'video').mediaKind).toBe('video');
  });

  it('generates a unique id via createUuid', () => {
    const result = buildMediaItem(jpg());
    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(result.id).toBe('test-uuid');
  });

  it('returns a shape conforming to MediaItem', () => {
    const result = buildMediaItem(jpg());
    expect(result).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      file: expect.any(File),
      localUrl: expect.any(String),
      status: 'queued',
      progress: 0,
      mediaKind: 'image',
    });
  });
});
