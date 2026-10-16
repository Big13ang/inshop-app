# On-device Post Image Compression (Web Workers)

> Single reference document for this task: spec, plan, tasks, progress log and review notes.
> Updated after every slice. Workflow follows addyosmani/agent-skills:
> interview-me → spec-driven-development → planning-and-task-breakdown → incremental-implementation
> + test-driven-development → code-review-and-quality, with source-driven-development and
> performance-optimization applied throughout.

---

## 1. Confirmed intent

| Field | Value |
|---|---|
| **Outcome** | New-post images are compressed on the user's device inside Web Workers before the TUS upload. |
| **User** | Sellers creating posts (up to 10 images, often on mid/low-end phones). |
| **Why** | Today every image uploads at full size (≤10 MB). The backend Sharp pipeline can then run up to 20 MozJPEG encodes per image with `sharp.concurrency(1)`, so the backend CPU is the bottleneck and uploads are slow. |
| **Success** | Typical photos upload at ≤100 KB WebP, and the backend's compression loop finishes on its first attempt. The UI stays responsive (no main-thread long tasks from compression). Unsupported or slow devices behave exactly as they do today. |
| **Constraint** | **The backend is NOT modified.** Wide browser compatibility, and no COOP/COEP (cross-origin isolation) headers. |
| **Out of scope** | Avatar uploads, HEIC/AVIF input, backend changes. |

### Decisions (from interview)
- **Engine:** a hybrid of native + jSquash.
  - Decoding uses `createImageBitmap` (native, handles EXIF orientation).
  - Resizing uses `@jsquash/resize` (lanczos3, Sharp's default kernel).
  - Encoding uses `@jsquash/webp` (libwebp, the same encoder Sharp uses).
  - wasm-vips was rejected: it needs `SharedArrayBuffer` and therefore site-wide COOP/COEP, and it is "early development".
- **Format:** always WebP (alpha preserved).
- **Quality (changed, see §13):** encode once at q95, not a 100 KB size search.
- **Sizing:** mirror the backend's dimension/quality ladder. Because the backend is untouched and still runs `validateResolution` (both sides ≥1080) on the uploaded file, there is one constraint: **the short side must never drop below 1080**. See §3.
- **Fallback:** silent. If the browser is unsupported, an error occurs, or the 8 s per-image budget is exceeded, the original file is uploaded unchanged and the backend compresses it as today.
- **UX:** a new `optimizing` media status with its own overlay label `بهینه‌سازی…`.

---

## 2. Backend contract (read-only reference)

Source: `inshop-backend/src/upload-session/image-processing.service.ts`, `tus/tus-config.ts:279`.

- `processUpload(buffer, mimetype)` runs `validateResolution` (width ≥1080 **and** height ≥1080, ≤40 MP), then `compressImage`.
- `compressImage` loops over `DIMENSIONS = [1920, 1440, 1200, 1080]` (each clamped to the original's max side, deduped) × `QUALITIES = [80, 65, 50, 35, 20]`. It applies `.rotate().resize(d, d, { fit: 'inside', withoutEnlargement: true })` and returns the **first** result ≤100 KB.
  - WebP settings: `{ quality, effort: 4, smartSubsample: true }`.
- The mimetype comes from the TUS metadata `filetype`, so a client-sent `image/webp` is accepted and stored as `.webp`.
- The thumbnail is generated from the uploaded buffer (300 px WebP).

**Effect of client compression with no backend change:** the backend receives a WebP of ≤100 KB at ≤ its target size. The first iteration (≤1920, q80) re-encodes an already small image and almost always fits, so the work drops from up to 20 encodes to about 1 (on a small decoded image).

---

## 3. Spec

### Tech stack
Next.js 16.3 (Turbopack), React 19 + React Compiler, TypeScript, Zustand, tus-js-client, Jest (jsdom) + RTL + MSW, Playwright.

Worker bundling uses `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })`, which Turbopack supports (`node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`, "Magic Comments").

### Commands
`rtk npm run lint` · `rtk npm test` · `rtk npm run build` · `rtk graphify update .`

### Compression algorithm (worker)
1. Decode with `createImageBitmap(file, { imageOrientation: 'from-image' })`. If `w*h > 40_000_000`, return err (the caller falls back).
2. Read RGBA via `OffscreenCanvas(w, h).getContext('2d').drawImage` → `getImageData`, then close the bitmap.
3. Build the candidate dimensions the way the backend does: `DIMENSIONS.map(d => min(maxSide, d))`, deduped.
4. For each candidate `d`, compute the size as "fit inside `d×d`, no upscale". **If the resulting short side would be below 1080, scale so the short side is exactly 1080 instead** (never upscale; originals are already ≥1080×1080 per `validateOne.ts`).
5. Resize with lanczos3, then **binary search** over the 5 discrete qualities for the highest quality that is ≤100 KB.
   - Size is monotonic in quality, so this gives the same pick as the backend's linear scan in ≤3 encodes.
   - Encode with `{ quality, method: 4 }` (matching `effort: 4`).
   - Return the first dimension that yields a fit.
6. If nothing fits, return the smallest encode, but only if it is smaller than the original. The backend handles the rest.
7. Transfer the `ArrayBuffer` back.

### Main-thread API
- `compressImage(file: File): Promise<File>` always resolves.
  - On success it returns a compressed `image/webp` File named `<basename>.webp`.
  - Otherwise it returns the original `File`.
  - Internally it uses `Result` (no try/catch).
- The worker pool is lazy:
  - Size is 2, or 1 when `hardwareConcurrency ≤ 4` or `deviceMemory ≤ 4`.
  - Each job has an 8 s timeout. On timeout the worker is terminated and respawned.
  - The pool is pre-warmed on `AddPostView` mount via `requestIdleCallback`.
- Support check: `Worker`, `OffscreenCanvas` with a 2D context (Safari ≥16.4), `createImageBitmap` and `WebAssembly`.

### Files
- `features/posts/new/services/compression/compressionPolicy.ts`: pure policy (constants, sizing, quality search).
- `features/posts/new/services/compression/compress.worker.ts`: the worker.
- `features/posts/new/services/compression/workerPool.ts`: pool, timeout, support check.
- `features/posts/new/services/compression/compressImage.ts`: the public entry point with fallback.
- Modified:
  - `features/posts/new/services/uploadPipeline.ts`: compress before `tusUpload`. `media.file` and `previewUrl` stay the original.
  - `features/posts/new/types.ts`: `MediaStatus` gets `'optimizing'`.
  - `features/posts/new/components/StatusOverlay.tsx`: an `optimizing` entry.
  - `AddPostView.tsx`: pre-warm.

### Code style / project rules
Named exports only, the Result pattern with no try/catch, no `useMemo`/`useCallback`, and no re-exports or barrels for new code. Extract multiline inline functions. Use `@/components/ui/*` components. Exact types. Colocate single-use helpers.

### Testing strategy
- Unit (Jest), in `compression/__tests__/`:
  - the policy: ladder, dedupe, short-side-1080 rule, binary search equals the linear scan;
  - the `compressImage` fallbacks, with the pool mocked because jsdom has no Worker.
- Update `uploadPipeline.test.ts` (the `optimizing` transition, and that the compressed file is passed to TUS) and the overlay tests.
- E2E/manual: Playwright MCP on `/app/posts/new`.

### Boundaries
- **Always:** silent fallback to the original, a bounded pool, transferables.
- **Ask first:** new dependencies beyond `@jsquash/webp` and `@jsquash/resize`; changing `pLimit(3)` upload concurrency.
- **Never:** modify the backend, add COOP/COEP headers, block the user on compression failure.

### Success criteria
- [ ] A 4000×3000 JPEG photo uploads as a ≤100 KB `image/webp` with long side 1920.
- [ ] A 2:1 panorama keeps its short side at 1080 and passes backend validation.
- [ ] A transparent PNG keeps its alpha in WebP.
- [ ] The `optimizing` overlay appears, followed by upload progress, then uploaded.
- [ ] No main-thread long task over 50 ms attributable to compression while adding 10 photos.
- [ ] With `OffscreenCanvas` unavailable, the original uploads (today's behavior).
- [ ] lint, test and build pass.

---

## 4. Tasks

| # | Task | Acceptance | Status |
|---|---|---|---|
| 1 | `compressionPolicy.ts` + tests | The policy tests pass; the binary search matches the linear scan on synthetic size functions. | ☑ |
| 2 | Install jSquash (exact pins), worker + pool + `compressImage` + fallback tests | The unit tests pass, and the worker builds under Turbopack (`npm run build`). | ☑ |
| 3 | Pipeline wiring, `optimizing` status, overlay, pre-warm | The pipeline and overlay tests pass, and TypeScript is clean. | ☑ |
| 4 | Review (Opus) and fixes | No blocking findings. | ☐ |
| 5 | Verification (build, browser check), `graphify update .` | The success criteria are checked. | ☐ |

---

## 5. Progress log
- 2026-10-16: Intent confirmed. Spec written. Backend excluded from scope, so the short-side ≥1080 rule was added.
- 2026-10-16 (tasks 1-3 implemented, not committed):
  - Task 1: `compression/compressionPolicy.ts` (constants, `getCandidateDimensions`, `getTargetSize`, `searchBestQuality`) + `__tests__/compressionPolicy.test.ts` (binary search == linear scan on 6 monotonic scenarios, <=3 encodes; 2:1 panorama keeps short side 1080). Deviation: `searchBestQuality` returns `{ fit, smallest }` (not just `fit | null`) so the worker can fall back to the smallest encode.
  - Task 2: installed exact pins `@jsquash/webp@1.5.0` and `@jsquash/resize@2.1.1` (latest stable; both published long before the 2-week cutoff). Created `types.ts` (shared worker message contract), `compress.worker.ts`, `workerPool.ts`, `compressImage.ts`, `__tests__/compressImage.test.ts` (unsupported / error / timeout / bigger output / success naming). APIs verified from node_modules: `@jsquash/webp/encode` default `encode(ImageData, { quality, method })` + `init()`; `@jsquash/resize` default `resize(ImageData, { width, height, method: 'lanczos3', fitMethod: 'stretch' })` + `initResize()`. WASM auto-loading via `import.meta.url` works under Turbopack (no manual init needed); `init()`/`initResize()` are only called to warm up. Imports use `@jsquash/webp/encode` to avoid bundling the decoder. The worker also drops results not smaller than the original. Jest: `workerPool` is mocked with a factory (automock still loads the real module, which uses `import.meta`).
  - Task 3: `MediaStatus` += `'optimizing'`; `uploadNextMedia` patches `optimizing`, awaits `compressImage(media.file)`, passes the result via a new `file` arg to the tus helper (`media.file`/`previewUrl` untouched; `pLimit(3)` unchanged); `StatusOverlay` got the `optimizing` entry (spinner + `بهینه‌سازی…`); `SelectPhaseFooter` `PENDING_STATS` now includes `optimizing` (DetailsPhaseFooter already treats any non-uploaded item as blocking); `AddPostView` prewarms the pool via `requestIdleCallback` (setTimeout 1 s fallback) in a cleaned-up mount effect. Tests: `uploadPipeline.test.ts` mocks `compressImage` and asserts the optimizing -> uploading order and that the compressed file reaches `tusUpload`; `AddPostView.test.tsx` mocks the pool; new `StatusOverlay.test.tsx`.
  - Results: `npm run lint` 0 errors (10 warnings / 9 infos, identical to baseline); `npm test` 85 suites / 630 tests pass; `tsc --noEmit` clean; `npm run build` succeeds and emits `webp_enc(_simd).wasm` and `squoosh_resize_bg.wasm` into `.next/static/media` (worker bundled). `graphify update .` run. Not yet verified in a real browser (task 5).

---

## 6. Review (Opus) — 2026-10-16

Rubric: addyosmani/agent-skills `code-review-and-quality`. It uses five axes (correctness, readability, architecture, security, performance) and these labels: **Critical** (blocks merge), *(no prefix)* = **Required**, **Consider**, **Nit**, **FYI**. This was a read-only review. Every finding below was checked by reading the code.

**Verdict: request-changes.** There is one Critical finding (an infinite worker-respawn loop) and three Required ones. The backend contract itself holds. A fuzz of `getTargetSize` over 1080..8000 × 11 heights (286k candidates) produced **0 outputs with a side below 1080**. Portrait, landscape, 2:1 panorama, 1080×1080 and 1080×N all stay ≥1080 on both sides. The binary search is also correct for none-fit, all-fit and single-candidate cases (≤3 encodes). The jSquash API usage matches the installed `.d.ts` files: `encode(ImageData, Partial<EncodeOptions>)`, `init(moduleOptionOverrides?)`, `resize(ImageData, {width,height,method,fitMethod})` and `initResize()`.

| # | Severity | Location | Finding & failure scenario | Suggested fix |
|---|---|---|---|---|
| 1 | **Critical** | `compression/workerPool.ts:63-69, 87-89` | **Infinite worker-respawn loop.** `onerror` calls `failAndRespawn`, and that always calls `addSlot()`, even when the slot had no job. If the worker script fails to load or parse, every new worker fires `error` again. That happens when the chunk 404s after a deploy or CDN purge (see commits 298f684 and 86d6c79). It also happens on Firefox 105–113, which has 2D `OffscreenCanvas` and so passes `isCompressionSupported`, but has no module workers until 114. Each new worker then respawns another, forever. The loop continues after the queue drains, refetching the script for as long as the page is open, starting from the idle prewarm on `AddPostView` mount. | Respawn only when the failure happened during a job (`slot.job !== null`) and the worker had previously posted a message. Otherwise just remove the slot. Better: add a circuit breaker. After N consecutive worker failures, set a module flag `disabled = true` that `isCompressionSupported`/`compressInWorker` honour, and fail the queue. |
| 2 | Required | `compression/workerPool.ts:104`, `uploadPipeline.ts:179-181` | **Slow devices end up worse than today, which breaks the spec success criterion.** A timeout respawns the worker and the next job runs the same 8 s budget again. On a low-end phone (pool size 1, `pLimit(3)`), each of 10 photos can burn 8 s and then upload the original anyway. That adds up to ~80 s of serialized delay compared with today's 0, and the network sits idle because compression holds the upload slot. | Add a session-level breaker: after the first timeout (or 2), skip compression for the rest of the session and resolve queued jobs as `err` immediately. |
| 3 | Required | `compression/compress.worker.ts:73-86`, `compressionPolicy.ts:21-40` | **Redundant resize and encode work.** Candidate *dimensions* are deduped, but the *target sizes* are not. Because of the short-side-1080 clamp, many collapse to the same size: 4000×3000 / 4032×3024 give `1920x1440, 1440x1080 ×3`; 1080×1920 and 2:1 panoramas give the same size ×4. The fuzz found 58% of candidates were duplicates. When a noisy photo misses at 1440×1080, the worker re-resizes from full resolution and re-encodes the identical image 2–3 more times (up to 6–9 wasted encodes). That pushes slow devices into the 8 s timeout from #2. | Dedupe by `${width}x${height}` (for example a `getCandidateTargets(w,h): TargetSize[]` in the policy, unit-tested), and stop once a target equals the previous one. |
| 4 | Required | `compression/__tests__/*` (no `workerPool` test); `compress.worker.ts:67-90` untested | **The riskiest code has no tests.** Timeout, respawn, queue draining, `onerror`, stale-id messages and "worker cannot be constructed" are all untested; #1 would have been caught. The worker's ladder loop (fit, smallest fallback, not-smaller-than-original) is untested too. The existing `compressImage` "timeout" test exercises the same branch as the "error" test, so it adds nothing. | Inject a worker factory (or stub `global.Worker` with a fake that emits `message`/`error`) and test the pool with fake timers. Move `compressPixels` into the policy with `resize`/`encode` injected and test it with synthetic size functions. |
| 5 | Consider | `workerPool.ts:22-23, 138-146`; `AddPostView.tsx:41` | **Workers live for the whole SPA session.** Workers are prewarmed on mount and never terminated, including after leaving `/posts/new`. A WebAssembly.Memory never shrinks, so after one 12 MP photo each worker keeps its grown resize/encode heap (~60 MB+) indefinitely. With a pool of 2 that adds up on 4–6 GB phones. | Terminate idle workers after the queue drains plus an idle delay (for example 30 s), and/or from the `schedulePrewarm` cleanup on unmount. |
| 6 | Consider | `compress.worker.ts:41-48` | **Peak memory per job is about 3–4× the full-resolution RGBA.** A 12 MP photo needs ~48 MB each for the bitmap, the `OffscreenCanvas` backing store and the `ImageData`, plus a wasm copy of the input in `resize`. The canvas is only released on GC. | After `getImageData`, set `canvas.width = canvas.height = 0`. If memory stays tight, consider `createImageBitmap(..., { resizeWidth, resizeHeight, resizeQuality: 'high' })` to a 2× target before lanczos. |
| 7 | Consider | `uploadPipeline.ts:179-181` | **Compression inside the `pLimit(3)` slot leaves the network idle.** The pool has ≤2 workers, so the third upload slot just waits on the pool queue. This matches the spec, but upload throughput drops even on fast devices. | Compress ahead in a separate step: start `compressImage` for all items up front, bounded by the pool, then upload as each resolves. |
| 8 | Nit | `compress.worker.ts:77` | **WebP options don't fully match the backend.** The backend uses `smartSubsample: true` (libwebp `use_sharp_yuv`) but the client does not, despite the doc saying it mirrors the backend. Resize also defaults to `linearRGB: true, premultiply: true`, while Sharp works in gamma space. | Pass `use_sharp_yuv: 1`, or document the deviation. |
| 9 | Nit | `compressImage.ts:22` | **Each attempt changes the tus fingerprint.** `new File(...)` gets `lastModified = Date.now()`, so the tus fingerprint (`name/type/size/lastModified/endpoint`) differs on every attempt and failed attempts leave orphan `tus::` localStorage entries. Resume is moot at ≤100 KB with a 2 MB chunk. | `new File([buffer], name, { type: 'image/webp', lastModified: file.lastModified })`. |
| 10 | Nit | `workerPool.ts:84-89`, `compress.worker.ts:76-77` | **Inline functions.** Multi-line inline handlers break the "extract functions" rule. | Extract named handlers. |
| 11 | Nit | `types.ts:15`, `workerPool.ts:75`, `compressImage.ts:20` | **Dead code and a duplicate check.** The `warmed` response is never consumed. `width/height/quality` are rebuilt and then ignored by the only consumer. The "smaller than original" check exists on both sides but on different paths. `queue.shift() as Job` is a cast. | Drop the unused fields and message, and keep the size check in one place. |
| 12 | Nit | `components/__tests__/StatusOverlay.test.tsx:21` | **Brittle test selector.** It asserts on the `svg.animate-spin` class, which is an implementation detail. | Assert the label and status only, or add an accessible `role="status"`. |
| 13 | FYI | backend `image-processing.service.ts:81-93` | **Backend re-encode.** The backend always re-encodes, starting at q80. A client output picked at q35/q50 can exceed 100 KB at q80 after decoding, so "first attempt" isn't guaranteed (still far cheaper than today). Double lossy encoding also costs some quality. | None (backend is out of scope). Just don't promise "1 encode". |
| 14 | FYI | `uploadPipeline.ts:179`, `handleMediaUploadProgress` | **Status label lags.** After compression the status stays `optimizing` until the first tus `onProgress`, which covers the POST create. The label is slightly misleading but harmless. | Optionally patch `uploading` (0%) right after `compressImage` resolves. |

**Checked and OK:**
- No `try/catch` and no `.then/.catch` in new code (the `.catch` in `tus-client.ts:74` predates this change).
- No new `export default`, no memo hooks, no re-exports, no `any`.
- SSR-safe: there is no `window`/`navigator` access at import time, and `new URL(import.meta.url)` is lazy.
- The bitmap is closed on every path.
- The result buffer is transferred.
- Every worker error path posts a response, and unhandled rejections fall to the 8 s timeout.
- A timeout resolves exactly once, clears the timer, and stale ids are ignored.
- `media.file` and `previewUrl` stay the original, so the object-URL lifecycle is unchanged.
- TUS `filename`/`filetype` come from the compressed File (`.webp`, `image/webp`), and the backend accepts them.
- Alpha is kept (`alpha_quality: 100`, lossy alpha preserved).
- The `useEffect` in `AddPostView` is a legitimate sync with an external system.
- Change size is ~400 lines including tests, which is fine.

**Verification (run during review):**
- `rtk npm test -- features/posts/new`: 17 suites / 140 tests pass.
- `rtk npx tsc --noEmit`: no errors.
- `rtk npm run lint`: 0 errors, 10 warnings (pre-existing, none in changed files).
- Build and browser were not re-run by the reviewer. The Firefox field evidence (44,780-byte PATCH) confirms the happy path end-to-end.


## 7. Fixes applied

Paths below are under `features/posts/new/` (`C/` = `services/compression/`). The pool was split so it is testable: `C/workerPool.ts` now holds a pure `createWorkerPool(deps)` with an injectable worker factory. `C/compressionPool.ts` is the singleton that owns `import.meta`, `Worker` and `navigator`, and is the module the rest of the app imports. `workerPool.ts` is no longer imported by the app directly.

| # | Status | What changed (file:line) | Tests |
|---|---|---|---|
| 1 | Fixed | `C/workerPool.ts:110` `failSlot` respawns only if `slot.job !== null \|\| slot.hasResponded`. A circuit breaker (`recordFailure`, `MAX_CONSECUTIVE_FAILURES = 3`) calls `disable()`, which fails the queue and drops idle workers. `compress()` and `prewarm()` short-circuit when disabled. `C/compressionPool.ts` `isCompressionSupported()` returns false when the pool is disabled. Only an `ok: true` response resets the counter. | `workerPool.test.ts`: "does not respawn a worker that errors with no job and never answered", "respawns an idle worker that had answered...", "disables compression after 3 consecutive worker failures", "resets the failure counter after a successful response" |
| 2 | Fixed | `C/workerPool.ts:126` `handleTimeout` calls `disable()` before failing the slot. Queued jobs resolve err without spawning, and later calls resolve `compression disabled`. | "times out with err and disables compression for the session", "fails queued jobs without spawning once disabled by a timeout" |
| 3 | Fixed | `C/compressionPolicy.ts:42` `getCandidateTargets` dedupes by width x height and replaces `getCandidateDimensions` (removed). | `compressionPolicy.test.ts` "getCandidateTargets": 4000x3000, 1080x1920, 4000x2000, 1080x1080 and 1300x1100 never repeat |
| 4 | Fixed | New `C/__tests__/workerPool.test.ts` (fake `WorkerLike` plus jest fake timers). `compressPixels` moved to `C/compressionPolicy.ts:101` with an injected `PixelCodec` (resize/encode). `compressImage.test.ts`: the old "timeout" test is replaced by "returns the original when the pool has disabled compression", which hits the disabled branch, distinct from the error test. | pool: success, worker-reported error, timeout and disabled-after-timeout, onerror with no job, onerror with a job, circuit breaker, queue draining, stale id, construction failure. `compressPixels`: "first quality that fits", "falls to a later size", "lower quality that fits when only later qualities do", "smallest encode when nothing fits", "does not resize or re-encode a repeated size" |
| 5 | Fixed | `C/workerPool.ts:92` `scheduleIdleShutdown` (`IDLE_TIMEOUT_MS = 30_000`, reset on each job). `C/workerPool.ts:80` `releaseIdle` terminates idle workers only, never in-flight ones. `releaseIdleCompressionWorkers()` in `C/compressionPool.ts` is called from the `AddPostView.tsx` prewarm effect cleanup. | "terminates workers after the idle timeout and respawns on demand", "releaseIdle terminates idle workers but keeps busy ones" |
| 6 | Fixed | `C/compress.worker.ts:41` sets `canvas.width = canvas.height = 0` after `getImageData`. The bitmap was already closed on every path. | Not unit-testable (OffscreenCanvas in a worker); verified by build and tsc |
| 7 | Skipped | Not trivial. It would restructure the upload concurrency, which was out of scope. | n/a |
| 8 | Fixed | `C/compress.worker.ts:55` passes `use_sharp_yuv: 1`. The installed `EncodeOptions` in `@jsquash/webp/codec/enc/webp_enc.d.ts` exposes `use_sharp_yuv`, so the option name was verified. The resize `linearRGB`/`premultiply` defaults were not changed (deviation from Sharp's gamma space remains). | tsc (typed option) |
| 9 | Fixed | `C/compressImage.ts:25` passes `lastModified: file.lastModified`. | `compressImage.test.ts` "keeps lastModified from the source file" |
| 10 | Fixed | `workerPool.ts` has named `handleWorkerMessage`, `handleWorkerError`, `handleTimeout`. `compress.worker.ts` has `webpCodec`, `handleMessage`, `handleCompress`, `handleWarmup`. The remaining inline handlers are single-line arrows. | n/a |
| 11 | Fixed | `C/types.ts`: the `warmed` response and the width/height/quality fields are removed. The "smaller than original" check now lives only in `C/compressImage.ts`. `queue.shift() as Job` is now a guard (`C/workerPool.ts:203`). | existing + `compressImage.test.ts` "output is not smaller" |
| 12 | Fixed | `components/StatusOverlay.tsx` spinner has `data-testid="status-spinner"`. `components/__tests__/StatusOverlay.test.tsx` asserts on it instead of `svg.animate-spin`. | "shows the optimizing label with a spinner" |

Not changed: findings 13 and 14 (FYI) were not actioned.

**Command outcomes (final run)**
- `rtk npm test -- features/posts/new`: 18 suites / 163 tests passed.
- `rtk npx tsc --noEmit`: no errors.
- `rtk npm run lint`: 0 errors, 10 warnings, 9 infos (pre-existing; none in compression files after fixing one `useOptionalChain` info in the new test).
- `rtk npm run build`: succeeded (exit 0).

---

## 8. Re-review (Opus) — 2026-10-16

Rubric: addyosmani/agent-skills `code-review-and-quality`. This was a read-only re-review: each section 7 claim was checked against the code rather than taken as given. Labels are Critical, Required, Consider and Nit.

**Verdict: approve.** No Critical or Required findings remain. The new findings below are Consider/Nit follow-ups and do not block merge.

### Verification of section 6 findings

| # | Status | Evidence |
|---|---|---|
| 1 | verified | Traced every spawn path in `C/workerPool.ts`. **(a) Respawns are capped.** A respawn happens only from `failSlot` (l.122). It requires `job !== null \|\| hasResponded` (l.113), and every `failSlot` and every construction failure (l.160) calls `recordFailure` first. Only an `ok: true` response resets the counter (l.137). So without a successful job in between, at most `maxFailures` respawns/creations happen before `disable()`. A respawned worker starts with `hasResponded = false`, so an idle respawned worker that errors is not respawned again. **(b) No synchronous loop.** Error events are async, so there is no synchronous recursion. **(c) No job is left unresolved.** In-flight jobs always have a `jobTimer`. Queued jobs are drained by `dispatch` on every finish, or failed by `failQueue` (when disabled, or when `slots.length === 0`). **(d) Removed workers stay quiet.** `removeSlot` nulls the handlers, so a removed worker can't call back. |
| 2 | verified | `disabled` is a closure variable of the single pool created lazily in `C/compressionPool.ts:23` (a module singleton, so it lasts the page session across `AddPostView` remounts). No code path sets it back to `false`. `handleTimeout` (l.126-130) calls `disable()` first, which fails the queue and drops idle workers. A second busy worker can still finish its in-flight job normally, and is then idle-terminated. |
| 3 | verified | Fuzzed `getCandidateTargets` over w,h ∈ 1080..8000 (steps 7/13, ≤40 MP) for **875,497 targets**. Results: **0** with a side <1080, **0** duplicates, **0** upscales, **0** above the 1920 ladder (except when the short-side clamp forces it). The backend `validateResolution` contract therefore holds. `compressPixels` (`compressionPolicy.ts:101-124`) reuses `source` when the target equals the source, and resizes from full resolution otherwise. It returns the first fit, else the smallest encode across all targets. `searchBestQuality` is unchanged and correct. |
| 4 | verified (gaps: N1, N2) | `workerPool.test.ts` asserts real behavior: instance counts, `terminated`, `isDisabled`, error strings, and posted-job counts. The "resets the failure counter" test would throw on `live()[0]` if the reset were removed, so it fails for the right reason. Fake timers are restored in `afterEach`. |
| 5 | verified | `startJob` clears the idle timer before assigning the job (l.178). The idle timer is only (re)armed when the slot has no job (l.142 after `finishJob`, l.173 for a new slot). So the 30 s timer can never terminate a worker with a job in flight. `removeSlot` clears both timers, so nothing leaks. `releaseIdle` only removes `job === null` slots, and all of this is synchronous on the main thread, so there is no race with `compress`. |
| 6 | verified | `compress.worker.ts:41-42`: the canvas is zeroed after `getImageData`. The bitmap is closed on both the >40 MP path (l.30) and after `trySync` (l.45), whether that succeeds or throws. The buffer is transferred (l.70). Every compress path posts a response. Only an unexpected `postMessage` throw would fall through to the 8 s timeout. |
| 7 | not verified (skipped by design) | Still a Consider: the third `pLimit(3)` slot waits on a pool of ≤2 workers. |
| 8 | verified | `node_modules/@jsquash/webp/codec/enc/webp_enc.d.ts:28` declares `use_sharp_yuv: number`, and `encode(data, options?: Partial<EncodeOptions>)` is in `encode.d.ts:22`. tsc is clean. |
| 9 | verified | `compressImage.ts:25`, with a test. |
| 10 | verified (see N5) | `workerPool.ts` and `compress.worker.ts` handlers are now named. |
| 11 | verified | The `warmed` message and the dimension fields are gone from `types.ts`. The size check happens only in `compressImage.ts:20`. `queue.shift()` is now guarded (l.203-204) instead of cast. |
| 12 | verified | `StatusOverlay.tsx` has `data-testid="status-spinner"`, and the test asserts it plus the label. |

**Other checks that passed (rules and safety):**
- **SSR safety.** `compressionPool.ts` touches `navigator`, `Worker`, `import.meta` and `OffscreenCanvas` only inside functions. At import time it only declares `let pool = null`. `AddPostView` → `compressionPool`/`uploadPipeline` → `compressImage` is import-safe.
- **Support check.** `isCompressionSupported` = not disabled AND `Worker`/`createImageBitmap`/`WebAssembly`/`OffscreenCanvas` 2D all available.
- **Project rules.** The new code has no try/catch and no `.then/.catch`. It adds no `any`, no new `export default` (the two in `StatusOverlay.tsx` and `AddPostView.tsx` were already there), no memo hooks and no re-exports or barrels.

### New findings

| # | Severity | Location | Finding & failure scenario | Fix |
|---|---|---|---|---|
| N1 | Nit | `C/__tests__/compressImage.test.ts:39-49` | **The "disabled" test does not test the disabled state.** It mocks `isCompressionSupported` to return `false` on its second call, so it exercises the same `!isCompressionSupported()` branch as the "unsupported" test (l.26). `compressImage` has no separate disabled branch, so section 7's "distinct branch" claim is inaccurate. The real coupling (`compressionPool.ts:37` `pool?.isDisabled()`) and `getPoolSize` are untested. (Removing l.37 changes no behavior, because the pool already returns `compression disabled`. It only saves a call.) | Rename or delete the test. If `compressionPool.ts` coverage is wanted, test it with stubbed `Worker`/`OffscreenCanvas` globals. |
| N2 | Consider | `C/workerPool.ts:159-161`; `workerPool.test.ts:204-208` | **The breaker's handling of construction failures is untested.** Deleting `recordFailure()` at l.160 keeps all 163 tests green, because the construction test only asserts `'worker unavailable'`. Scenario: a CSP `worker-src` block or a `SecurityError` makes `new Worker` throw. Without the counter, every image would retry construction. That's cheap, but the section 7 claim relies on it. | Add a test: with a factory that always returns `err`, three `compress()` calls should make `isDisabled()` true and the factory should not be called again. |
| N3 | Consider | `C/workerPool.ts:173` with `:128`; `AddPostView.tsx:46` | **Prewarm expires, and a cold start can trip the session-wide timeout.** Prewarmed workers get the 30 s idle timer as soon as they are created. If the user spends more than 30 s choosing photos, the warm workers are terminated, and the first job pays the WASM fetch and compile *inside* the 8 s budget. On a slow network or a low-end phone with a 12 MP photo, that one timeout disables compression for the rest of the session. (Plausible; not measured.) | Don't arm the idle timer on prewarmed, never-used slots while the page is mounted (`releaseIdle` on unmount already covers cleanup). Or start the job timer only after the first warmup/ready ack. |
| N4 | Nit | `C/compressionPool.ts:9`, `:27-34` | **A widening `as` cast, and a canvas allocated on every check.** `navigator as NavigatorWithDeviceMemory` can be replaced by a guard (`'deviceMemory' in navigator && typeof navigator.deviceMemory === 'number'`). `hasBrowserSupport` also allocates an `OffscreenCanvas` and a 2D context on every call (once per image plus prewarm). | Use the guard, and cache the support result in a module `let`. |
| N5 | Nit | `AddPostView.tsx:33-36`, `:39-42` | **Two multi-line inline cleanup arrows**, which break the "extract functions" rule. | Extract a named `stopPrewarm(cancel: () => void)` helper (or similar) and return `() => stopPrewarm(...)` on one line. |

### Command results (re-review run)
- `rtk npm test -- features/posts/new`: **18 suites / 163 tests passed** (exit 0, 2.7 s).
- `rtk npx tsc --noEmit`: **no errors** (exit 0).
- `rtk npm run lint`: **0 errors, 10 warnings, 9 infos** (exit 0). 488 files were checked. None of the diagnostics are in compression files; the warnings are pre-existing `noImgElement` etc.
- Fuzz script (scratchpad, `tsx`) against the real `getCandidateTargets`: results as in #3.
- Not re-run: `npm run build` and a browser check (task 5).

## 9. Nit & Consider fixes (N1–N5)

| Finding | File:line changed | Test name(s) | Status |
|---|---|---|---|
| N1 (Nit): "disabled" test duplicated the unsupported branch | `services/compression/__tests__/compressImage.test.ts:39` | `re-checks support per call and skips the pool once it reports unsupported` | changed-instead: renamed. Driving the real disabled state needs the real `compressionPool` module, which Jest cannot load (`import.meta`), so the test keeps the module mock. |
| N2 (Consider): construction-failure breaker untested | `services/compression/workerPool.ts:160` (`recordFailure()` in `addSlot`) | `disables the pool after 3 consecutive worker construction failures` | fixed. Mutation check: removing `recordFailure()` at l.160 makes the test fail (3rd call returns `worker unavailable` instead of `compression disabled`). Restored; 17/17 pass. |
| N3 (Consider): prewarmed workers expire before first use | `services/compression/workerPool.ts:142` (idle timer armed only in `handleWorkerMessage`), `addSlot` no longer arms it | `does not terminate a prewarmed worker that was never used`, `arms the idle timer only after a job finishes` | fixed. Respawned slots with no job also no longer get an idle timer; they are freed by `releaseIdle` on unmount or by the next job. |
| N4 (Nit): widening `as` cast; OffscreenCanvas created on every check | `services/compression/compressionPool.ts:7` (`hasDeviceMemory` guard), `:13`, `:39-41` (`browserSupport` cache) | covered by existing `compressImage` and `workerPool` tests (no `compressionPool` unit test, as with N1) | fixed. Cache is computed lazily on first call, never at import time. |
| N5 (Nit): multi-line inline cleanup arrows | `features/posts/new/AddPostView.tsx:28-46` (`cancelIdlePrewarm`, `cancelTimeoutPrewarm`) | none (behavior unchanged; covered by existing AddPostView tests) | fixed |

---

## 10. Four-skill review (code-review-and-quality, code-simplification, security-and-hardening, performance-optimization) — 2026-10-16

Skills installed for this task under `.claude/skills/` (+ `.claude/references/` checklists), from addyosmani/agent-skills.

**Verdict before fixes:** request changes. No Critical/High. Core policy/pool/worker logic unchanged since §8/§9 and verified (backend ≥1080 contract holds; jSquash usage matches types; WASM only in worker chunks; dev-only code compiled out of production; new deps Apache-2.0, no install scripts, no audit findings).

| # | Severity | Finding | Planned fix |
|---|---|---|---|
| R1 | Required | Debug auto-download fires for every dev & every Playwright run | Keep, but opt-in via `NEXT_PUBLIC_DEBUG_COMPRESSION=true` (+ dev only); can't reject |
| R2 / S2 | Required / Low | `console.info` in production logs user file names → GlitchTip breadcrumbs (PII) | Use `logger.forDomain('upload')`, no file name |
| S1 | Medium | 40 MP cap runs only after full decode → 50/108 MP phone photos or PNG bombs can crash the tab | Reject > 40 MP from header in `validateOne` |
| C1 | Consider | Pipeline relies on "always resolves"; a rejection leaves item stuck at `optimizing`, Next disabled forever | `Result.try` around `compressImage` |
| C2 / S3 | Consider / Low | tus resume filter is a raw `startsWith` (no path boundary, trailing-slash fragile) | URL-parse origin + path boundary; drop stale entries |
| C3 / S4 / S5 | Consider / Low | dev-proxy: unanchored Location rewrite, hard-coded origin, binds 0.0.0.0, reflects any Origin | Pure `rewriteLocation`, 127.0.0.1 default, CORS allowlist |
| C5 | Consider | `compressionPool.ts` untestable in Jest (`import.meta`) | Move `createWorker` to its own module |
| P1 | Consider | Peak memory ~4× RGBA; WebKit gets 2 workers (no `deviceMemory`) | Close bitmap early; pool size 1 on WebKit w/o deviceMemory |
| P2 | Consider | Prewarm spawns 2 workers + WASM on every page mount | Prewarm 1 worker |
| N1 / N2 / N3 | Nit | untyped `Set`, non-memoized codec init, `.catch` chain | Typed set, memoized init, `Result.try` |
| Simplify | — | redundant disabled branch, `{ buffer }` wrapper, `uploadMediaWithTus` pass-through | Remove where behavior-preserving |
| Tests | — | ~60 missing unit/integration tests + E2E suite (see review report) | Added in fix pass |

Out of scope, flagged to user: `.npmrc` contains a commented base64 registry credential (rotate it); `npm audit --omit=dev` has 7 pre-existing findings incl. a critical `next` 16.0–16.3.7 advisory; `package-lock.json` has unrelated `devOptional→dev` churn; `next dev -H 0.0.0.0` exposes the dev server to the LAN.

## 11. QA checklist

Run on: Chrome (desktop + Android), Safari (macOS + iOS 16.4+), Firefox. Use the fixture set: 12 MP JPEG ×6, 4000×2000 panorama, transparent PNG ≥1080, 48–50 MP JPEG ≤10 MB, 1080×1080 low-detail JPEG, HEIC (should be rejected).

**Functional — compression**
- [ ] 12 MP JPEG uploads as `image/webp`, `.webp` filename, ≤100 KB, 1920×1440 (check PATCH `Content-Length` / `Upload-Metadata`).
- [ ] Portrait (e.g. 3000×4000) → 1440×1920; both sides ≥1080.
- [ ] 2:1 panorama keeps short side 1080 and is accepted by the backend (no "resolution too small" error).
- [ ] 1080×1080 image is accepted, not upscaled.
- [ ] Transparent PNG keeps transparency in the uploaded WebP (open the stored image on a coloured background).
- [ ] Photo taken in portrait on a phone (EXIF orientation 6/8) uploads upright.
- [ ] Already-tiny image (no size gain) uploads the original unchanged.
- [ ] Visual quality: compare original vs compressed at 100% (set `NEXT_PUBLIC_DEBUG_COMPRESSION=true` in dev to auto-download) — no visible banding/blockiness on faces, text, gradients.
- [ ] > 40 MP image is rejected up-front with a clear toast (not after a long wait).
- [ ] HEIC/AVIF/animated WebP still rejected as before.

**Functional — UI & flow**
- [ ] Each cell shows `بهینه‌سازی…` spinner, then upload progress %, then done.
- [ ] Next/Continue stays disabled while any image is optimizing or uploading; enables when all uploaded.
- [ ] 10 photos at once: all finish; order preserved; delete one mid-compression works; max-10 limit still enforced.
- [ ] Original thumbnail preview stays sharp (preview uses the original, not the compressed file).
- [ ] Publish post → images display correctly in feed, post page, and thumbnails.
- [ ] Error toasts show the original filename (not `.webp`).

**Fallbacks & resilience**
- [ ] Old browser / no OffscreenCanvas (e.g. Safari < 16.4, or delete `window.OffscreenCanvas` in console before picking): originals upload, nothing breaks.
- [ ] Block the worker chunk or `.wasm` in DevTools (request blocking): originals upload; worker requested ≤3 times (no respawn loop; check Network tab for 30 s).
- [ ] Throttle CPU 6× + Slow 3G: if a job exceeds 8 s, that image and the rest upload originals without further delay.
- [ ] Network drop mid-upload → retry/resume works; after reload, resume does not hit a different API host.
- [ ] Navigate away and back to the new-post page: no errors; idle workers are released (DevTools → Sources → Threads).
- [ ] No download dialogs appear in normal dev or Playwright runs (flag off).

**Performance**
- [ ] DevTools Performance trace while adding 10 photos: no main-thread long task >50 ms from compression; page stays scrollable/tappable.
- [ ] INP for the file-picker change ≤200 ms.
- [ ] 12 MP compression time per image on a mid-range Android ≤3 s (p95) — read the worker timing / log.
- [ ] Memory: iPhone with 10 × 12 MP photos — no tab reload; Chrome task manager peak per worker <300 MB.
- [ ] Network: total upload bytes for 10 photos ≈ ≤1 MB (vs ~30–60 MB before).
- [ ] WASM served with `Content-Type: application/wasm` and long-lived cache headers from the CDN (`curl -I` on the `/_next/static/media/*.wasm` URL in prod).
- [ ] Visiting the page without uploading does not download more than ~150 KB extra (1 worker + WASM).

**Backend / ops**
- [ ] Backend logs show compression finishing on the first attempt for most images (q80, ≤1920) — "Compressed image … maxDim: 1920, quality: 80".
- [ ] Thumbnails (300 px WebP) are generated for compressed uploads.
- [ ] GlitchTip: no user file names in breadcrumbs.

**Security / privacy**
- [ ] No file names or image data in production console/logs.
- [ ] `NEXT_PUBLIC_DEBUG_COMPRESSION` unset in all deployed environments.
- [ ] Dev proxy only listens on 127.0.0.1 by default.

## 12. Fix pass after four-skill review — 2026-10-16

All §10 items fixed (Sonnet, two parallel agents; verified by Opus):
- R1: auto-download now needs `NODE_ENV=development` **and** `NEXT_PUBLIC_DEBUG_COMPRESSION=true` (added to `env.ts`, default `false`); cannot reject.
- R2/S2: `logger.forDomain('upload')` with `{ action: 'compress_image', outcome, inputBytes, outputBytes }`, no file names.
- S1: `validateOne` rejects > 40 MP from the header (`RESOLUTION_TOO_HIGH`, `ERROR_MESSAGES.upload.resolutionTooHigh`).
- C1: pipeline wraps `compressImage` in `Result.try`; `uploadMediaWithTus` wrapper removed.
- C2/S3/N3: tus resume uses URL origin + path-boundary match, drops stale `tus::` entries, no `.catch` chain or casts.
- C3/S4/S5: `scripts/devProxyHelpers.mjs` (`rewriteLocation`, `buildAllowedOrigins`); proxy binds `127.0.0.1` (opt-in `DEV_PROXY_HOST`); CORS allowlist (+ `DEV_PROXY_ALLOWED_ORIGINS`).
- C5 + worker extraction: `createCompressionWorker.ts`, pure `workerHandler.ts`; N2 memoized codec init.
- P1: bitmap closed right after `drawImage`; WebKit without `deviceMemory` → pool size 1. P2: prewarm one worker.
- Simplifications: redundant disabled branch removed; `JobResult = Result<ArrayBuffer, string>`.
- E2E: `e2e/posts/compression.spec.ts` (8 scenarios) + real fixtures in `e2e/fixtures/images/` (generator `generate.mjs`). Worker-404 bound changed from "≤3" to "requests stop and ≤5" (prewarm + on-demand worker can both fail before the breaker trips).

Not unit-tested: `createCompressionWorker.ts` (`import.meta` can't be parsed by babel-jest) — covered by E2E.

**Results:** `npm test` 91 suites / 773 tests pass · `tsc --noEmit` clean · lint 0 errors (10 pre-existing warnings) · `npm run build` passes · E2E compression spec 8/8 in Chromium (run: `E2E_MOCK=true npx playwright test e2e/posts/compression.spec.ts --project=chromium`; requires `npx playwright install` — local browser build was outdated).

## 13. Quality change: encode at q95, no size cap — 2026-10-16

**Problem.** The sizing rules in §3 aimed the phone's output at ≤100 KB with a quality search (q80 down to q20). The backend then always re-encodes what it receives. Two lossy passes softened photos, which the seller saw as a quality loss compared with the backend-only path.

**Measurement** (real test photo, 1086×1448 JPEG, PSNR against the source; higher is better):

| Path | Upload | Final PSNR |
|---|---|---|
| Backend only (today's server path) | original | 41.20 dB |
| Client q80, then backend | 66 KB | 39.97 dB |
| Client q90, then backend | 126 KB | 40.40 dB |
| **Client q95, then backend** | 191 KB | **41.00 dB** |
| Lossless upload, then backend | 746 KB | 41.20 dB |

The measurements used Sharp's encoder as a stand-in for jSquash. Verify on dev with `NEXT_PUBLIC_DEBUG_COMPRESSION=true`.

**Decision.** Encode once at `CLIENT_WEBP_QUALITY = 95` on the largest backend-accepted size. The size search and the 100 KB target are removed. The backend still makes the final size decision.

**Trade-off.** Uploads grow (about 66 KB → 191 KB for this photo; 79 KB for the 4000×3000 fixture). They stay far below typical camera originals. Backend CPU is unchanged, because the backend still re-encodes every photo.

**Superseded:** the quality bullet in §1, steps 5–6 of "Compression algorithm" in §3, and the 100 KB goal in the success criteria. The rest of §3 (sizing, the short-side ≥1080 rule, dedupe, worker design) still applies.

**Code:** `features/posts/new/services/compression/compressionPolicy.ts` (`compressPixels`, `CLIENT_WEBP_QUALITY`); tests in `__tests__/compressionPolicy.test.ts`.
