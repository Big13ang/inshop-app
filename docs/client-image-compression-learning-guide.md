# How photo compression works in the browser — a step-by-step guide

> Written for: someone learning this feature from zero, who may find long text hard to follow.
> How to read it: each step is short, has one job, and ends with a **"Where to look"** line. Read one step, open the file, then move on. Do not try to read everything at once.

---

## Step 0 — The problem in one sentence

When a seller adds a photo, the phone sends the full camera file (often 3–10 MB) to the server. The server then shrinks it with Sharp, which is slow and uses a lot of server CPU.

**Goal:** shrink the photo **on the phone** first, so the server has less work. The photo is encoded once at high quality (q95) so the upload stays close to the original look.

**Rule:** the page must never freeze while this happens, and if anything goes wrong, the original photo is uploaded as before. Nothing breaks for the user.

---

## Step 1 — The big picture (read this map first)

```
User picks photos
   │
   ▼
uploadPipeline.ts ── validate (size, type, dimensions)
   │
   ▼
status = "optimizing"  (the spinner you see on the photo)
   │
   ▼
compressImage(file)  ◄── the one function the pipeline calls
   │
   ▼
compressionPool  ── picks a free worker (a helper thread)
   │
   ▼
worker thread  ── decode → resize → encode WebP  (WASM does the math)
   │
   ▼
back to compressImage ── smaller? use it. Otherwise use the original.
   │
   ▼
tusUpload(file) ── sends the file to the server in chunks
   │
   ▼
status = "uploaded"
```

**Key idea:** the page only sends a request to a helper thread and waits. The heavy work happens somewhere else.

**Where to look:** [uploadPipeline.ts](features/posts/new/services/uploadPipeline.ts) — start at the function `uploadNextMedia`.

---

## Step 2 — Words you will see (keep this open)

| Word | Plain meaning |
|---|---|
| **Main thread** | The one thread that draws the page and handles taps. If it's busy, the UI freezes. |
| **Web Worker** | A helper thread the browser runs beside the main thread. It can't touch the page, only messages. |
| **WASM (WebAssembly)** | Compiled code that runs close to native speed. Used here for the image math. |
| **Codec** | A program that encodes or decodes an image format (here: WebP). |
| **Decode** | Turn a JPEG/PNG file into raw pixels. |
| **Resize** | Make the pixel grid smaller. |
| **Encode** | Turn raw pixels into a compressed file (WebP). |
| **Quality** | A number 0–100 for WebP. Lower = smaller file, more visible loss. |
| **Pool** | A small group of workers we reuse instead of creating a new one per photo. |
| **Circuit breaker** | After repeated failures, stop trying and fall back for the rest of the session. |
| **Result** | Our project's way to return success or error without `try/catch`. See `lib/utils/result.ts`. |

---

## Step 3 — Start the helper early (prewarm)

Loading the WASM takes time. So when the new-post page opens, we start one worker in advance.

- [AddPostView.tsx](features/posts/new/AddPostView.tsx) calls `prewarmCompression()` on mount, using `requestIdleCallback` (run when the browser is idle).
- If the user leaves the page, `releaseIdleCompressionWorkers()` stops the workers.

**Why:** the first photo would otherwise wait for the WASM download and compile.

**Where to look:** [compressionPool.ts:56](features/posts/new/services/compression/compressionPool.ts#L56) (`prewarmCompression`) and [compressionPool.ts:62](features/posts/new/services/compression/compressionPool.ts#L62).

---

## Step 4 — Can this browser do it at all? (support check)

Before starting, `isCompressionSupported()` checks that the browser has:
- `Worker` (helper threads),
- `WebAssembly`,
- `createImageBitmap` (decodes images),
- `OffscreenCanvas` with a 2D context (draws pixels off-screen).

If any is missing, we return `unsupported` and upload the original. The result is cached, so the check runs once.

**Where to look:** [compressionPool.ts:47](features/posts/new/services/compression/compressionPool.ts#L47).

---

## Step 5 — Create the worker

[createCompressionWorker.ts:5](features/posts/new/services/compression/createCompressionWorker.ts#L5) creates the worker with:

```ts
new Worker(new URL('./compress.worker.ts', import.meta.url), { type: 'module' })
```

- `new URL(..., import.meta.url)` tells the bundler (Turbopack in Next.js) to build `compress.worker.ts` as its own file.
- If the browser refuses to create the worker, the function returns an error instead of throwing.

**Why it's separate:** Jest (our test runner) can't read `import.meta`, so this one line lives in its own file. Tests replace it with a fake.

---

## Step 6 — The pool: who gets the next photo

[workerPool.ts](features/posts/new/services/compression/workerPool.ts) holds the workers and the queue.

- **Pool size:** 1 worker on low-core machines, on iPhone-like WebKit browsers without memory info, or when the device has ≤ 4 GB. Otherwise 2.
- **Queue:** if all workers are busy, the job waits in line (first in, first out).
- **Timeout:** each job has **8 seconds** (`JOB_TIMEOUT_MS`). After that the worker is killed and the photo falls back to the original.
- **Idle shutdown:** a worker that has been used and then sits idle for **30 seconds** is terminated (`IDLE_TIMEOUT_MS`), to free memory.
- **Circuit breaker:** after **3 failures in a row** (`MAX_CONSECUTIVE_FAILURES`), compression is turned off for the session. A successful job resets the count.

**Why:** a broken worker must not loop forever, and a slow phone must not wait 8 s per photo.

**Where to look:** constants at [workerPool.ts:4-6](features/posts/new/services/compression/workerPool.ts#L4-L6).

---

## Step 7 — What the messages look like

The page and the worker talk only by messages. The types are in [types.ts](features/posts/new/services/compression/types.ts).

- Page → worker: `{ type: 'warmup' }` or `{ type: 'compress', id, file }`.
- Worker → page: `{ type: 'compressed', id, ok: true, buffer }` or `{ ..., ok: false, error }`.

The `id` matches a reply to its job. A late reply from a killed worker is ignored because its id no longer matches.

The `buffer` is **transferred**, not copied, so the big bytes don't get duplicated in memory.

---

## Step 8 — Inside the worker: the three steps

The worker file is [compress.worker.ts](features/posts/new/services/compression/compress.worker.ts). Its logic lives in [workerHandler.ts](features/posts/new/services/compression/workerHandler.ts), which is easier to test.

1. **Warm up (`initCodecs`):** load the WASM for the encoder and the resizer. Done once; the result is remembered.
2. **Decode (`decodePixels`):**
   - `createImageBitmap(file, { imageOrientation: 'from-image' })` decodes the file and applies the phone's rotation (EXIF).
   - Reject it if it has more than 40 million pixels (a memory safety limit).
   - Draw it on an `OffscreenCanvas`, read the pixels, then **close the bitmap right away** to free memory.
   - Set the canvas size to 0 to release it.
3. **Resize + encode (`compressPixels`):** described in Step 9.

**Where to look:** [workerHandler.ts:38](features/posts/new/services/compression/workerHandler.ts#L38) (`decodePixels`) and [compress.worker.ts:13-19](features/posts/new/services/compression/compress.worker.ts#L13-L19) (which codecs are used).

---

## Step 9 — The policy: how the size and quality are chosen

This is the most important logic. It is in [compressionPolicy.ts](features/posts/new/services/compression/compressionPolicy.ts), and it is **pure** (no browser APIs), so it is easy to test.

**Constants** (mirror the backend, which we do not change):
- `DIMENSIONS = [1920, 1440, 1200, 1080]` — the longest side to try, biggest first.
- `CLIENT_WEBP_QUALITY = 95` — the one WebP quality used. Why 95: the backend always re-encodes what it receives, so a low quality here would be encoded twice and look soft. Measured: q80 then backend scored 40.0 dB, q95 then backend 41.0 dB, backend alone 41.2 dB.
- `MIN_SIDE = 1080` — the **shortest** side must stay at least 1080, or the backend rejects the upload.

**Step by step:**
1. `getCandidateTargets(width, height)` builds a list of sizes to try, one per dimension. It never enlarges the image, and it removes duplicates.
2. For each size, `compressPixels` resizes the image once.
3. There is **no size search** any more. The image is encoded once at q95 (`compressPixels`). The backend decides the final size.
4. The largest size on the ladder is the one sent. The backend, not the phone, makes it smaller if needed.

**Why the short-side rule matters:** a 2:1 panorama resized to 1920 wide would be 960 tall, which the backend rejects. So we scale it so the short side is 1080 instead.

**Where to look:** [compressionPolicy.ts:23](features/posts/new/services/compression/compressionPolicy.ts#L23) (`getTargetSize`), [:42](features/posts/new/services/compression/compressionPolicy.ts#L42) (`getCandidateTargets`), [:62](features/posts/new/services/compression/compressionPolicy.ts#L62) (`searchBestQuality`), [:101](features/posts/new/services/compression/compressionPolicy.ts#L101) (`compressPixels`).

---

## Step 10 — Back on the page: use it or keep the original

[compressImage.ts](features/posts/new/services/compression/compressImage.ts) is the **only** function the rest of the app calls. Its promise **always resolves** to a `File`:

| Outcome | What is returned |
|---|---|
| Browser unsupported | original |
| Worker failed or timed out | original |
| Compressed file is not smaller | original |
| Compressed and smaller | new `.webp` `File` |

The new file keeps the original `lastModified`, so the upload's fingerprint stays the same across retries.

It also logs one line per photo through the project logger, with **no file name** (privacy). Outcomes: `unsupported`, `worker_error`, `no_gain`, `compressed`.

**Debug only:** if `NODE_ENV=development` **and** `NEXT_PUBLIC_DEBUG_COMPRESSION=true`, the compressed file is downloaded so you can compare it with the original by eye.

**Where to look:** [compressImage.ts:57](features/posts/new/services/compression/compressImage.ts#L57).

---

## Step 11 — Back in the pipeline: upload

[uploadPipeline.ts](features/posts/new/services/uploadPipeline.ts):
1. Sets the status to `optimizing` (spinner).
2. Calls `compressImage`, wrapped in `Result.try` so a crash can never leave the photo stuck.
3. Passes the result (compressed or original) to `tusUpload`.
4. Sets the status to `uploaded` or `failed`.

`pLimit(3)` means at most 3 photos are in this step at once.

**Important:** the preview on screen always uses the **original** file. Only the upload uses the compressed one.

**Where to look:** [uploadPipeline.ts:152-159](features/posts/new/services/uploadPipeline.ts#L152-L159).

---

## Step 12 — The backend (we don't change it, but it matters)

The server does the same kind of work with Sharp, and it trusts nothing the client sends.

- It checks the file: the **shorter** side must be ≥ 1080 and it must be ≤ 40 MP. Our output always passes.
- It re-encodes with Sharp only when needed. A client output already at 1920 px and quality 80 usually needs no more work.

**Where to look:** `inshop-backend/src/upload-session/image-processing.service.ts` (`validateResolution`, `compressImage`).

---

## Step 13 — The fallbacks (why users never get stuck)

| What breaks | What the user sees |
|---|---|
| No WASM or worker support | original uploads silently |
| Worker script 404 (after a deploy) | original uploads; after 3 failures compression stays off |
| A photo takes > 8 s | that photo uploads original; the worker is replaced |
| Photo > 40 MP | rejected up front with a message (the backend would reject it too) |
| Compressed file bigger than original | original uploads |

---

## Step 14 — Where the WASM files actually are

- You won't find them in `src/`. The build copies them to `.next/static/media/` (for example `webp_enc_simd.wasm`, ~126 KB compressed).
- The worker downloads them the first time it starts.
- They are only used inside the worker, so the main page bundle stays small.

**To see it happen:** open DevTools → Network, filter by `wasm`, open the new-post page, and add a photo.

---

## Step 15 — Things that are easy to get wrong

1. **Don't add `useMemo`/`useCallback`.** The project uses the React Compiler.
2. **Don't add `try/catch`.** Use `Result.try` (project rule).
3. **Don't import `window`, `navigator` or `Worker` at the top of a file.** The page is rendered on the server too, and those don't exist there.
4. **Don't change the backend limits** (1080 and 40 MP) without changing the client too.
5. **Don't compress the preview.** Only the upload uses the compressed file.

---

## Step 16 — Try it yourself (a 15-minute exercise)

1. Open [compressionPolicy.test.ts](features/posts/new/services/compression/__tests__/compressionPolicy.test.ts) and run `npm test -- compressionPolicy`. Read the test names: they describe the rules.
2. Change `CLIENT_WEBP_QUALITY` temporarily to `80` and run the tests again. See which tests fail and why. Then revert.
3. Read [workerHandler.test.ts](features/posts/new/services/compression/__tests__/workerHandler.test.ts) to see how the worker is tested without a real browser.

---

## Quick glossary of file names

| File | One-line job |
|---|---|
| `compressImage.ts` | Public entry: returns a compressed file or the original |
| `compressionPool.ts` | Support check, prewarm, release; owns the pool |
| `createCompressionWorker.ts` | Creates the real Web Worker |
| `workerPool.ts` | Queue, timeouts, idle shutdown, circuit breaker |
| `compress.worker.ts` | The worker file; wires the WASM codecs |
| `workerHandler.ts` | Worker logic: warm up, decode, compress |
| `compressionPolicy.ts` | Pure rules: sizes and the q95 encode |
| `types.ts` | Messages between page and worker |
| `uploadPipeline.ts` (outside) | Calls compressImage, then upload |
