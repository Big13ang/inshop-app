import { env } from '@/env';
import { getMediaUrl, getMediaKind, getThumbnailUrl } from '../media';

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
  const originalCdnUrl = env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    (env as { NEXT_PUBLIC_CDN_URL: string }).NEXT_PUBLIC_CDN_URL = 'http://localhost:9000/inshop-uploads';
  });

  afterAll(() => {
    (env as { NEXT_PUBLIC_CDN_URL: string }).NEXT_PUBLIC_CDN_URL = originalCdnUrl;
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
    expect(
      getMediaUrl({
        id: 'posts/id.png',
        url: 'https://example.com/item.jpg',
        storageKey: 'posts/storage.png',
        thumbnailStorageKey: 'posts/thumb.png',
      })
    ).toBe('https://example.com/item.jpg');

    expect(
      getMediaUrl({
        id: 'posts/id.png',
        url: 'posts/cover.png',
        storageKey: 'posts/storage.png',
        thumbnailStorageKey: 'posts/thumb.png',
      })
    ).toBe('http://localhost:9000/inshop-uploads/posts/cover.png');
  });

  it('returns clean key if NEXT_PUBLIC_CDN_URL is empty', () => {
    (env as { NEXT_PUBLIC_CDN_URL: string }).NEXT_PUBLIC_CDN_URL = '';
    expect(getMediaUrl('avatars/user.jpg')).toBe('avatars/user.jpg');
  });
});

describe('getThumbnailUrl', () => {
  const originalCdnUrl = env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    (env as { NEXT_PUBLIC_CDN_URL: string }).NEXT_PUBLIC_CDN_URL = 'http://localhost:9000/inshop-uploads';
  });

  afterAll(() => {
    (env as { NEXT_PUBLIC_CDN_URL: string }).NEXT_PUBLIC_CDN_URL = originalCdnUrl;
  });

  it('returns empty string for null, undefined, or empty string', () => {
    expect(getThumbnailUrl(null)).toBe('');
    expect(getThumbnailUrl(undefined)).toBe('');
    expect(getThumbnailUrl('')).toBe('');
  });

  it('prioritizes thumbnailStorageKey with CDN URL formatting', () => {
    expect(
      getThumbnailUrl({
        id: 'm1',
        storageKey: 'uploads/seller/full.webp',
        thumbnailStorageKey: 'uploads/seller/thumb.webp',
        url: 'http://localhost:9000/inshop-uploads/uploads/seller/full.webp',
      })
    ).toBe('http://localhost:9000/inshop-uploads/uploads/seller/thumb.webp');
  });

  it('returns absolute URL directly if thumbnailStorageKey starts with http:// or https://', () => {
    expect(
      getThumbnailUrl({
        id: 'm1',
        storageKey: 'uploads/seller/full.webp',
        thumbnailStorageKey: 'https://cdn.example.com/thumb.webp',
        url: 'https://cdn.example.com/full.webp',
      })
    ).toBe('https://cdn.example.com/thumb.webp');
  });

  it('falls back to thumbnailUrl if thumbnailStorageKey is missing', () => {
    expect(
      getThumbnailUrl({
        id: 'm1',
        storageKey: 'uploads/seller/full.webp',
        thumbnailUrl: 'uploads/seller/thumb-fallback.webp',
        url: 'http://localhost:9000/inshop-uploads/uploads/seller/full.webp',
      })
    ).toBe('http://localhost:9000/inshop-uploads/uploads/seller/thumb-fallback.webp');
  });

  it('falls back to getMediaUrl when thumbnail fields are missing', () => {
    expect(
      getThumbnailUrl({
        id: 'm1',
        storageKey: 'uploads/seller/full.webp',
      })
    ).toBe('http://localhost:9000/inshop-uploads/uploads/seller/full.webp');
  });

  it('handles string input directly', () => {
    expect(getThumbnailUrl('uploads/thumb.webp')).toBe('http://localhost:9000/inshop-uploads/uploads/thumb.webp');
  });
});

