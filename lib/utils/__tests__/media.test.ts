import { getMediaUrl, getMediaKind } from '../media';

describe('getMediaKind', () => {
  it('returns video for video mime types', () => {
    expect(getMediaKind('video/mp4')).toBe('video');
    expect(getMediaKind(new File([], 'test.mp4', { type: 'video/webm' }))).toBe('video');
  });

  it('defaults to image for non-video mime types', () => {
    expect(getMediaKind('image/png')).toBe('image');
    expect(getMediaKind('application/pdf')).toBe('image');
    expect(getMediaKind(new File([], 'test.jpg', { type: 'image/jpeg' }))).toBe('image');
  });
});

describe('getMediaUrl', () => {
  const originalCdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = 'http://localhost:9000/inshop-uploads';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalCdnUrl;
  });

  it('returns empty string for null, undefined, or empty string', () => {
    expect(getMediaUrl(null)).toBe('');
    expect(getMediaUrl(undefined)).toBe('');
    expect(getMediaUrl('')).toBe('');
  });

  it('returns original URL if it starts with http:// or https://', () => {
    expect(getMediaUrl('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
    expect(getMediaUrl('http://example.com/avatar.jpg')).toBe('http://example.com/avatar.jpg');
  });

  it('concatenates NEXT_PUBLIC_CDN_URL with relative string key', () => {
    expect(getMediaUrl('avatars/user.jpg')).toBe('http://localhost:9000/inshop-uploads/avatars/user.jpg');
    expect(getMediaUrl('/avatars/user.jpg')).toBe('http://localhost:9000/inshop-uploads/avatars/user.jpg');
  });

  it('resolves objects with url, storageKey, or id', () => {
    expect(getMediaUrl({ url: 'https://example.com/item.jpg' })).toBe('https://example.com/item.jpg');
    expect(getMediaUrl({ url: 'posts/cover.png' })).toBe('http://localhost:9000/inshop-uploads/posts/cover.png');
    expect(getMediaUrl({ storageKey: 'posts/storage.png' })).toBe('http://localhost:9000/inshop-uploads/posts/storage.png');
    expect(getMediaUrl({ id: 'posts/id.png' })).toBe('http://localhost:9000/inshop-uploads/posts/id.png');
  });

  it('returns clean key if NEXT_PUBLIC_CDN_URL is empty', () => {
    process.env.NEXT_PUBLIC_CDN_URL = '';
    expect(getMediaUrl('avatars/user.jpg')).toBe('avatars/user.jpg');
  });
});
