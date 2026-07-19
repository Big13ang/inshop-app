import { createUuid } from '../uuid';

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
