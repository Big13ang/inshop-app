import { createUuid, extractMediaId } from '../uuid';

describe('createUuid', () => {
  it('uses crypto.randomUUID when available', () => {
    const randomUUID = jest.fn(() => 'test-uuid');

    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: randomUUID,
    });

    expect(createUuid()).toBe('test-uuid');
    expect(randomUUID).toHaveBeenCalled();
  });

  it('falls back when crypto.randomUUID is unavailable', () => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    });

    expect(createUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

describe('extractMediaId', () => {
  it('extracts mediaId from a full URL', () => {
    expect(
      extractMediaId('http://localhost:3000/uploads/63effa67-0af5-4686-a3da-28f3d5dceeef'),
    ).toBe('63effa67-0af5-4686-a3da-28f3d5dceeef');
  });

  it('handles query parameters and trailing hashes', () => {
    expect(
      extractMediaId('http://localhost:3000/uploads/63effa67-0af5-4686-a3da-28f3d5dceeef?v=1#section'),
    ).toBe('63effa67-0af5-4686-a3da-28f3d5dceeef');
  });

  it('formats unhyphenated 32-char hex string into standard UUID', () => {
    expect(
      extractMediaId('http://localhost:3000/uploads/63effa670af54686a3da28f3d5dceeef'),
    ).toBe('63effa67-0af5-4686-a3da-28f3d5dceeef');
  });

  it('returns fallbackId when URL is undefined or empty', () => {
    expect(extractMediaId(undefined, 'fallback-id')).toBe('fallback-id');
    expect(extractMediaId(null, 'fallback-id')).toBe('fallback-id');
  });
});
