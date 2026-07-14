import { createChunkStrategy } from '../services/chunkStrategy';

describe('Upload Integration (Real tus-js-client + FetchHttpStack + MSW)', () => {
  it('successfully uploads a file through tus-js-client and FetchHttpStack to MSW', async () => {
    // MSW intercepts requests to http://localhost:3000/uploads
    const strategy = createChunkStrategy('http://localhost:3000/uploads');
    const onProgress = jest.fn();
    const file = new File(['hello world'], 'hello.txt', { type: 'text/plain' });

    const uploadPromise = strategy.upload({
      id: 'integration-test-id',
      file,
      onProgress,
      signal: new AbortController().signal,
    });

    const resultUrl = await uploadPromise;
    expect(resultUrl).toContain('/uploads/mock-');
    expect(onProgress).toHaveBeenCalled();
  });

  it('correctly aborts the upload using real tus-js-client and FetchHttpStack', async () => {
    const strategy = createChunkStrategy('http://localhost:3000/uploads');
    const ctrl = new AbortController();
    const file = new File(['hello world'.repeat(1000)], 'hello-large.txt', { type: 'text/plain' });

    const uploadPromise = strategy.upload({
      id: 'abort-integration-test-id',
      file,
      onProgress: () => {},
      signal: ctrl.signal,
    });

    // Abort immediately
    ctrl.abort();

    await expect(uploadPromise).rejects.toThrow();
  });
});
