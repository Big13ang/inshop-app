import { storage } from '../localStorage';

const KEY = 'test:key';

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('storage.get', () => {
  it('returns ok with null when key does not exist', () => {
    const result = storage.get(KEY);
    expect(result).toEqual({ ok: true, value: null });
  });

  it('returns ok with the stored string value', () => {
    localStorage.setItem(KEY, '1');
    const result = storage.get(KEY);
    expect(result).toEqual({ ok: true, value: '1' });
  });

  it('returns err when localStorage.getItem throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const result = storage.get(KEY);
    expect(result.ok).toBe(false);
  });
});

describe('storage.set', () => {
  it('returns ok and persists the value', () => {
    const result = storage.set(KEY, 'hello');
    expect(result).toEqual({ ok: true, value: undefined });
    expect(localStorage.getItem(KEY)).toBe('hello');
  });

  it('returns err when localStorage.setItem throws', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota exceeded'); });
    const result = storage.set(KEY, 'x');
    expect(result.ok).toBe(false);
  });
});

describe('storage.remove', () => {
  it('returns ok and removes the key', () => {
    localStorage.setItem(KEY, 'bye');
    const result = storage.remove(KEY);
    expect(result).toEqual({ ok: true, value: undefined });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('returns err when localStorage.removeItem throws', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    const result = storage.remove(KEY);
    expect(result.ok).toBe(false);
  });
});

describe('storage.has', () => {
  it('returns false when key is absent', () => {
    expect(storage.has(KEY)).toBe(false);
  });

  it('returns true when key is present', () => {
    localStorage.setItem(KEY, 'value');
    expect(storage.has(KEY)).toBe(true);
  });

  it('returns false when storage.get fails', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(storage.has(KEY)).toBe(false);
  });
});
