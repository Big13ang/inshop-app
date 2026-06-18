import { createChunkStrategy } from '../services/chunkStrategy';

// ── Environment setup ─────────────────────────────────────────────────────────

// sha256Hex calls blob.arrayBuffer() then crypto.subtle.digest(). Both involve
// real async I/O that conflicts with jest.useFakeTimers(). Stub both so that
// the checksum step resolves in the next microtask tick regardless of timer mode.
beforeAll(() => {
  // Stub arrayBuffer on jsdom's Blob prototype (File.prototype's grandparent)
  const jsdomBlobProto = Object.getPrototypeOf(Object.getPrototypeOf(new File([], 'probe.txt')));
  Object.defineProperty(jsdomBlobProto, 'arrayBuffer', {
    configurable: true,
    writable: true,
    value: () => Promise.resolve(new ArrayBuffer(0)),
  });

  Object.defineProperty(global, 'crypto', {
    configurable: true,
    writable: true,
    value: {
      ...(global.crypto ?? {}),
      subtle: { digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)) },
    },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHUNK = 4; // tiny chunk so tests stay fast

/** File that takes exactly `n` chunks of size CHUNK to upload. */
const fileOfChunks = (n: number) =>
  new File([new ArrayBuffer(n * CHUNK)], 'f.jpg', { type: 'image/jpeg' });

const okResponse = (url = 'https://cdn/f.jpg') =>
  ({ ok: true, status: 200, json: async () => ({ url }) }) as unknown as Response;

const errResponse = (status: number) =>
  ({ ok: false, status, json: async () => ({}) }) as unknown as Response;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createChunkStrategy', () => {

  // Slice 1 — fileId is included in the chunk URL (protocol-level bug fix)
  it('includes the file ID in every chunk request URL', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);

    await strategy.upload('my-id', fileOfChunks(1), jest.fn(), new AbortController().signal);

    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('fileId=my-id'),
      expect.any(Object),
    );
  });

  // Slice 2 — progress is reported at start (0%) and after each chunk
  it('reports incremental progress after each chunk', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);
    const onProgress = jest.fn();

    await strategy.upload('id', fileOfChunks(2), onProgress, new AbortController().signal);

    // 0% reported immediately, then 50% and 100% after each chunk completes
    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(onProgress).toHaveBeenCalledTimes(3);
  });

  // Slice 3 — returns the URL from the last chunk's JSON response
  it('returns the uploadedUrl from the server response', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse('https://cdn/final.jpg'));
    const strategy = createChunkStrategy(fetcher, CHUNK);

    const url = await strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal);
    expect(url).toBe('https://cdn/final.jpg');
  });

  // Slice 4 — retries once on a 5xx error
  it('retries on a 5xx response', async () => {
    jest.useFakeTimers();

    const fetcher = jest.fn()
      .mockResolvedValueOnce(errResponse(500))
      .mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);

    const resultPromise = strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal);
    await jest.advanceTimersByTimeAsync(5_000);
    await resultPromise;

    // 1 failed chunk attempt + 1 successful retry + 1 finalize = 3 total
    expect(fetcher).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  // Slice 5 — does NOT retry on 4xx
  it('throws immediately on a 4xx response without retrying', async () => {
    const fetcher = jest.fn().mockResolvedValue(errResponse(400));
    const strategy = createChunkStrategy(fetcher, CHUNK);

    await expect(
      strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal),
    ).rejects.toThrow();

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  // Slice 6 — retries 429 (rate-limited)
  it('retries on 429 rate-limit responses', async () => {
    jest.useFakeTimers();

    const fetcher = jest.fn()
      .mockResolvedValueOnce(errResponse(429))
      .mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);

    const resultPromise = strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal);
    await jest.advanceTimersByTimeAsync(5_000);
    await resultPromise;

    // 1 failed chunk attempt + 1 successful retry + 1 finalize = 3 total
    expect(fetcher).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  // Slice 7 — throws after exhausting all retries
  it('throws after 3 retries on a persistent 5xx (4 total attempts)', async () => {
    jest.useFakeTimers();

    const fetcher = jest.fn().mockResolvedValue(errResponse(503));
    const strategy = createChunkStrategy(fetcher, CHUNK);

    const resultPromise = strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal);

    // Attach the rejection assertion BEFORE advancing timers.
    // This wires up a .catch() handler immediately, preventing Node from treating
    // the eventual rejection as "unhandled" during the timer-advance phase.
    const assertRejected = expect(resultPromise).rejects.toThrow(/503/);

    // Advance past all retry delays: 1s + 2s + 4s = 7s.
    // advanceTimersByTimeAsync flushes microtasks between each step so the
    // async/await chain runs correctly.
    await jest.advanceTimersByTimeAsync(10_000);
    await assertRejected;

    expect(fetcher).toHaveBeenCalledTimes(4); // 1 initial + 3 retries

    jest.useRealTimers();
  });

  // Slice 8 — abort signal check fires before the first fetch call
  it('rejects without calling fetcher when signal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort(); // pre-abort before upload starts
    const fetcher = jest.fn();
    const strategy = createChunkStrategy(fetcher, CHUNK);

    await expect(
      strategy.upload('id', fileOfChunks(1), jest.fn(), ctrl.signal),
    ).rejects.toThrow();

    // The signal.aborted check at the top of the loop must run before any fetch
    expect(fetcher).not.toHaveBeenCalled();
  });

  // Slice 9 — loadResumeState fails gracefully when localStorage throws
  it('handles localStorage errors gracefully when loading resume state', async () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    const fetcher = jest.fn().mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);

    const url = await strategy.upload('id-err', fileOfChunks(1), jest.fn(), new AbortController().signal);
    expect(url).toBe('https://cdn/f.jpg');

    spy.mockRestore();
  });

  // Slice 10 — synchronization of chunks from server when resume state exists
  it('syncs chunks list from server when resume state is present', async () => {
    const file = fileOfChunks(3); // 3 chunks total
    const key = `upload:${file.name}:${file.size}:${file.lastModified}`;
    localStorage.setItem(key, JSON.stringify({ fileId: 'existing-id', uploadedChunks: [0] }));

    const fetcher = jest.fn()
      .mockResolvedValueOnce(({
        ok: true,
        status: 200,
        json: async () => ({ received: [0, 1] }), // Server has chunk 0 and 1
      } as unknown as Response))
      .mockResolvedValueOnce(okResponse()) // chunk 2 upload
      .mockResolvedValueOnce(okResponse('https://cdn/resumed.jpg')); // Finalize

    const strategy = createChunkStrategy(fetcher, CHUNK);
    const onProgress = jest.fn();

    const url = await strategy.upload('id', file, onProgress, new AbortController().signal);

    expect(url).toBe('https://cdn/resumed.jpg');
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/api/upload/existing-id/chunks'),
      expect.any(Object),
    );
    // Only chunk 2 needs to be uploaded since 0 and 1 are skipped
    expect(fetcher).toHaveBeenCalledTimes(3); // 1 check + 1 upload chunk 2 + 1 finalize = 3
    expect(fetcher).not.toHaveBeenCalledWith(
      expect.stringContaining('index=0'),
      expect.any(Object),
    );
    expect(fetcher).not.toHaveBeenCalledWith(
      expect.stringContaining('index=1'),
      expect.any(Object),
    );
  });

  // Slice 11 — throws when finalize API call rejects
  it('throws an error when the finalize call returns an error status', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce(okResponse()) // chunk 0
      .mockResolvedValueOnce(({
        ok: false,
        status: 500,
        json: async () => ({ error: 'assembly error' }),
      } as unknown as Response)); // finalize

    const strategy = createChunkStrategy(fetcher, CHUNK);

    await expect(
      strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal),
    ).rejects.toThrow('assembly error');
  });

  // Slice 12 — falls back to a default message when the finalize error body has none
  it('falls back to "Finalize failed" when the error response has no error field', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce(okResponse()) // chunk 0
      .mockResolvedValueOnce(({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as unknown as Response)); // finalize

    const strategy = createChunkStrategy(fetcher, CHUNK);

    await expect(
      strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal),
    ).rejects.toThrow('Finalize failed');
  });

  // Slice 13 — totalChunks falls back to 1 for a zero-byte file
  it('treats a zero-byte file as a single chunk', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);
    const onProgress = jest.fn();

    await strategy.upload('id', new File([], 'empty.jpg', { type: 'image/jpeg' }), onProgress, new AbortController().signal);

    // 1 chunk upload + 1 finalize = 2 fetcher calls
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  // Slice 14 — a transport-level failure on the chunk request is retried
  it('retries a chunk upload when the fetcher itself rejects (network error)', async () => {
    jest.useFakeTimers();

    const fetcher = jest.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);

    const resultPromise = strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal);
    await jest.advanceTimersByTimeAsync(5_000);
    await resultPromise;

    // 1 failed chunk attempt + 1 successful retry + 1 finalize = 3 total
    expect(fetcher).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  // Slice 15 — a transport-level failure on the finalize request propagates
  it('throws when the finalize fetch itself rejects (network error)', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce(okResponse()) // chunk 0
      .mockRejectedValueOnce(new Error('finalize network down'));

    const strategy = createChunkStrategy(fetcher, CHUNK);

    await expect(
      strategy.upload('id', fileOfChunks(1), jest.fn(), new AbortController().signal),
    ).rejects.toThrow('finalize network down');
  });

  // Slice 16 — sync-with-server step tolerates a failing /chunks lookup
  it('falls back to local resume state when the server chunks lookup fails', async () => {
    const file = fileOfChunks(2);
    const key = `upload:${file.name}:${file.size}:${file.lastModified}`;
    localStorage.setItem(key, JSON.stringify({ fileId: 'existing-id', uploadedChunks: [0] }));

    const fetcher = jest.fn()
      .mockResolvedValueOnce(errResponse(500)) // /chunks lookup fails
      .mockResolvedValueOnce(okResponse()) // chunk 1 upload
      .mockResolvedValueOnce(okResponse('https://cdn/resumed.jpg')); // finalize

    const strategy = createChunkStrategy(fetcher, CHUNK);

    const url = await strategy.upload('id', file, jest.fn(), new AbortController().signal);

    expect(url).toBe('https://cdn/resumed.jpg');
    // Chunk 0 stays skipped from local state even though the server lookup failed.
    expect(fetcher).not.toHaveBeenCalledWith(
      expect.stringContaining('index=0'),
      expect.any(Object),
    );
  });
});

