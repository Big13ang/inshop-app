import { createChunkStrategy } from '../services/chunkStrategy';

describe('createChunkStrategy', () => {
  it('creates chunk strategy with upload method', async () => {
    const strategy = createChunkStrategy();
    expect(strategy).toBeDefined();
    expect(typeof strategy.upload).toBe('function');

    const result = await strategy.upload({
      id: 'test-id',
      file: new File([''], 'test.txt'),
      onProgress: () => {},
      signal: new AbortController().signal,
    });
    expect(typeof result).toBe('string');
  });
});
