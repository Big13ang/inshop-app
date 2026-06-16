import { createChunkStrategy } from '../services/chunkStrategy';

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

  // Slice 2 — progress is reported after each chunk
  it('reports incremental progress after each chunk', async () => {
    const fetcher = jest.fn().mockResolvedValue(okResponse());
    const strategy = createChunkStrategy(fetcher, CHUNK);
    const onProgress = jest.fn();

    await strategy.upload('id', fileOfChunks(2), onProgress, new AbortController().signal);

    expect(onProgress).toHaveBeenCalledWith(50);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(onProgress).toHaveBeenCalledTimes(2);
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

    expect(fetcher).toHaveBeenCalledTimes(2);

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

    expect(fetcher).toHaveBeenCalledTimes(2);

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
});
