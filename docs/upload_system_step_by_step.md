# Add New Post — Developer Onboarding

A guided walkthrough of `features/posts/new` for someone reading this code for the first time.  
Read the files in the order below — each session builds on the previous one.

---

## Before you start

```bash
# Start the app
rtk npm run dev             # http://localhost:3000/app/posts/new

# Run all unit + component tests
rtk npm test

# Run E2E tests in a real browser (dev server must be running)
rtk npx playwright test e2e/posts/add-post.spec.ts --headed
```

---

## Session 1 — The data model (15 min)

**Read:** `features/posts/new/types.ts`

Everything in this feature is built around `MediaItem`. Before reading any other file, understand this shape:

```typescript
interface MediaItem {
  id:          string;       // crypto.randomUUID() — unique per file pick
  file:        File | null;  // the browser File object; set to null after upload
  localUrl:    string;       // blob URL for showing the thumbnail before upload
  status:      MediaStatus;  // queued → uploading → uploaded (or failed/cancelled)
  progress:    number;       // 0–100; only meaningful when status = 'uploading'
  mediaKind:   MediaKind;    // 'image' | 'video'
  uploadedUrl?: string;      // the CDN URL returned by the server on success
}
```

**Why `file` becomes `null` after upload:**  
`File` objects hold the raw binary in memory. Once the server has the bytes, we don't need the reference. Setting it to `null` lets the garbage collector reclaim the memory. The thumbnail still works because `localUrl` (a blob URL) keeps a separate reference that we control explicitly.

**Why `localUrl` and `uploadedUrl` are separate:**  
The thumbnail in the gallery shows `localUrl` immediately — no network round-trip needed. Once the upload completes, the slider switches to `uploadedUrl` (the permanent CDN link). The gallery cell always uses `uploadedUrl ?? localUrl`.

**Terminal statuses** — once reached, the item never changes state again:  
`uploaded` | `failed` | `cancelled`

---

## Session 2 — The validation and factory layer (15 min)

**Read in order:**
1. `features/posts/new/services/validateBatch.ts`
2. `features/posts/new/services/buildMediaItem.ts`

**`validateBatch`** is a pure function — no side effects, no throws:

```typescript
validateBatch(files, kind) → { valid: File[], rejected: Array<{file, reason}> }
```

It checks MIME type (`image/jpeg`, `image/png`, `image/webp`) and file size (≤ 10 MB). Callers decide what to do with rejected files — `useMediaUpload` shows a Sonner toast.

**`buildMediaItem`** is a pure factory:

```typescript
buildMediaItem(file, kind) → MediaItem  // status: 'queued', progress: 0
```

It assigns `id = crypto.randomUUID()` and `localUrl = URL.createObjectURL(file)`. **Blob URLs must be revoked eventually** — this happens in `mediaStore.removeItem()`. If you forget to revoke, you leak memory proportional to the file size.

---

## Session 3 — The state store (20 min)

**Read:** `features/posts/new/services/mediaStore.ts`

**Why `Map<id, MediaItem>` instead of `MediaItem[]`:**

The gallery can have 10–20 items. Each uploading item fires progress updates ~10× per second. If the store used an array, every update would re-render all gallery cells. With a Map, each cell subscribes only to its own item:

```typescript
// GalleryCell — only re-renders when itemMap.get(id) changes
const item = useMediaStore((s) => s.itemMap.get(id));
```

**Key methods to know:**

| Method | Behaviour |
|---|---|
| `addItems(items)` | Appends — never replaces. Safe to call multiple times. |
| `removeItem(id)` | Revokes the blob URL before deleting. This is the only place blob URLs are cleaned up. |
| `toggleSelected(id)` | No-op if `status !== 'uploaded'`. You can't select a queued or uploading item. |
| `_setStatus(id, s)` | If the new status is not `'uploaded'`, auto-removes the item from `selectedIds`. |
| `_setUploaded(id, url)` | Sets `uploadedUrl`, `status='uploaded'`, `progress=100`, `file=null`. |

**`createMediaStore()` vs `useMediaStore`:**  
`useMediaStore` is the singleton used by the app. `createMediaStore()` is the factory used in tests — each test creates its own store so state doesn't leak between tests.

---

## Session 4 — The upload engine (20 min)

**Read in order:**
1. `features/posts/new/services/chunkStrategy.ts`
2. `features/posts/new/hooks/useMediaUpload.ts`

### `chunkStrategy` — how a file reaches the server

The strategy slices a file into 5 MB chunks and uploads each with a POST:

```
POST /api/upload/chunk?fileId={id}&index={i}&total={n}
body: chunk blob
response: { url: "https://cdn.example.com/..." }  (on the last chunk)
```

**Retry logic:**

| HTTP status | Action |
|---|---|
| `0` (network error) | Retry with backoff |
| `429` (rate limit) | Retry with backoff |
| `5xx` (server error) | Retry with backoff |
| `4xx` (except 429) | Fail immediately — retrying won't help |
| `200` | Success |

Backoff delays: 1 s → 2 s → 4 s. After 3 attempts, throw and let the hook mark the item `'failed'`.

**The `fetcher` parameter:**  
`createChunkStrategy(fetcher = window.fetch)`. Unit tests pass `jest.fn()` instead of real `fetch` — zero network calls, deterministic responses.

### `useMediaUpload` — concurrency via `p-limit`

The hook uses [`p-limit`](https://github.com/sindresorhus/p-limit) to cap concurrent uploads at 3. There is no manual queue or active-count bookkeeping.

```typescript
const limit = useRef(pLimit(3));
const controllers = useRef(new Map<string, AbortController>());
```

`p-limit` acts as the queue: when you call `limit(fn)`, it runs `fn` immediately if a slot is free, otherwise it waits. When a running task finishes, p-limit automatically starts the next queued one.

**`addFiles` — the entry point:**

```typescript
function addFiles(files, kind = 'image') {
  const { valid, rejected } = validateBatch(files, kind);
  if (rejected.length > 0) toast.warning('فقط JPG، PNG و WebP مجاز است', ...);
  if (valid.length === 0) return;

  const items = valid.map(f => buildMediaItem(f, kind));
  useMediaStore.getState().addItems(items);   // show thumbnails immediately

  for (const item of items) {
    const ctrl = new AbortController();
    controllers.current.set(item.id, ctrl);
    void limit.current(() => uploadOne(item.id, item.file!));  // enqueue
  }
}
```

**`cancelUpload(id)` — two cases handled transparently:**

```
Still queued (slot not yet opened):
  ctrl.abort() + _setStatus('cancelled') + controllers.delete(id)
  → when the slot opens, uploadOne sees no controller → returns early

Already uploading:
  ctrl.abort() + _setStatus('cancelled') + controllers.delete(id)
  → the in-flight fetch receives the abort signal → Result.try catches AbortError
  → Result.match err branch: signal.aborted → _setStatus('cancelled') (idempotent)
```

**Unmount cleanup** (useEffect return):
```typescript
for (const ctrl of controllers.current.values()) ctrl.abort();
controllers.current.clear();
limit.current.clearQueue();  // ← prevents queued tasks from starting after unmount
```

---

## Session 5 — The hook layer continued (20 min)

**Read in order:**
1. `features/posts/new/hooks/useSubmitPost.ts`
2. `features/posts/new/hooks/usePostFlow.ts`

### `useSubmitPost` — the post submission mutation

This is a React Query `useMutation` that handles `POST /api/posts`.

```typescript
export function useSubmitPost(onSuccess: () => void) {
  return useMutation({
    mutationFn: submitPost,     // fetch('/api/posts', { method: 'POST', body: { caption, mediaUrls } })
    onSuccess,                  // called by React Query when the server responds 2xx
    onError: () => toast.error('ارسال پست با خطا مواجه شد، دوباره تلاش کنید'),
  });
}
```

**Why React Query instead of plain `fetch` in an event handler?**  
React Query gives you `isPending` (for the loading spinner), automatic error state, and a clean `onSuccess` / `onError` callback pair — without any manual `useState` for loading/error flags.

### `usePostFlow` — phase state and navigation

The hook manages the phase transition (`'select'` → `'details'`) and wires the Submit action.

**Navigation is imperative — it happens in `onSuccess`, not in a `useEffect`.**

```typescript
const submitPost = useSubmitPost(() => onNavigate('pending-posts'));

function handleNext() {
  if (phase === 'select') {
    if (selectedIds.length === 0) { toast.warning(text.alertNoImages); return; }
    setPhase('details');
    return;
  }

  // details phase:
  if (!caption.trim()) { toast.warning(text.alertNoCaption); return; }

  const mediaUrls = selectedIds
    .map((id) => itemMap.get(id)?.uploadedUrl)
    .filter((url): url is string => !!url);

  submitPost.mutate({ caption, mediaUrls });
}
```

**Why no `useEffect` for navigation?**

Effects run because a component was *displayed*. Navigation after Share is a consequence of a *user action* — it belongs in the event handler chain. A `useEffect` watching derived state would fire the moment the user enters the details phase if uploads were already done, navigating away before the caption is typed.

---

## Session 6 — The UI components (20 min)

**Read in order:**
1. `features/posts/new/components/SelectedGallery.tsx`
2. `features/posts/new/components/SelectedMediaSlider.tsx`
3. `features/posts/new/AddPostView.tsx`

### `SelectedGallery` — per-cell subscriptions

The parent `SelectedGallery` only reads `itemMap.keys()` — a list of IDs. It does NOT pass item data down as props. Each `GalleryCell` fetches its own data:

```typescript
function GalleryCell({ id, selectionIndex, onToggle }) {
  const item = useMediaStore((s) => s.itemMap.get(id));
  // renders based on item.status
}
```

This means a progress tick on item A causes zero re-renders on items B, C, D.

**`StatusOverlay` — what the user sees during upload:**

| Status | Visual |
|---|---|
| `queued` | Dark overlay + Clock icon |
| `uploading` | Semi-transparent overlay + `42٪` text + growing bottom bar |
| `uploaded` | Nothing — transparent, thumbnail is fully visible |
| `failed` | Red overlay + "خطا" label + "تلاش دوباره" retry button |
| `cancelled` | Dark overlay + X icon + "لغو شد" label |

### `AddPostView` — the assembly point

```tsx
<input
  type="file"
  accept="image/*"    ← opens native photo library on iOS/Android
  multiple
  className="hidden"  ← invisible; triggered by the "اضافه کردن" footer button
  onChange={(e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) media.addFiles(files);
    e.target.value = '';  ← reset so the same file can be picked again
  }}
/>
```

`accept="image/*"` is the key attribute that makes the native iOS/Android gallery picker open instead of the generic file browser.

---

## Session 7 — The tests (30 min)

The codebase has three testing layers. Each layer has a distinct job.

```
E2E (Playwright)     — real Chromium, real file input, real Sonner toasts
    ↑ 37 tests, slow, tests full browser behaviour
Component (RTL)      — jsdom + MSW, tests user flows end-to-end in React
    ↑ ~30 tests, medium speed
Unit (Jest)          — pure TS functions, injected fakes, no browser
    ↑ ~90 tests, fast, tests logic correctness
```

### Unit tests

**`validateBatch.test.ts`** — start here, simplest.  
Tests that valid MIMEs pass, invalid ones are rejected, large files are rejected, mixed batches split correctly.

**`mediaStore.test.ts`** — store mutations.  
Uses `createMediaStore()` (factory) so each test gets a clean instance. Tests that `addItems` appends, `removeItem` revokes blob URLs, `toggleSelected` only works on uploaded items, `_setStatus` auto-removes from selectedIds.

**`chunkStrategy.test.ts`** — HTTP and retry logic.  
The `fetcher` is always `jest.fn()`. Uses `jest.useFakeTimers()` for retry backoff.

> **Important pattern in retry tests:**  
> Attach the rejection assertion BEFORE advancing fake timers:
> ```typescript
> const result = strategy.upload(...);
> const assertion = expect(result).rejects.toThrow(/503/);  // ← handler attached first
> await jest.advanceTimersByTimeAsync(10_000);               // ← now advance time
> await assertion;                                           // ← then resolve assertion
> ```
> If you flip the order, the promise rejects before a `.catch()` handler exists — Node logs an unhandled rejection and the test fails in two places.

**`AddPostView.test.tsx`** — component-level flows.  
Uses MSW to mock both `POST /api/upload/chunk` (returns `{ url }`) and `POST /api/posts` (returns `{ id: 'post-123' }`). The `beforeAll` block stubs `URL.createObjectURL` and `URL.revokeObjectURL` (jsdom doesn't implement them). The `afterEach` block resets the Zustand store with `useMediaStore.setState({...})`. The `setup()` helper wraps the component in a fresh `QueryClientProvider` with `retry: false` so mutation failures don't slow down tests.

### E2E tests

**Read:** `e2e/pages/AddPostPage.ts` then `e2e/posts/add-post.spec.ts`

**Page Object Model pattern:**  
All locators and actions live in `AddPostPage`. The spec file only calls methods — no raw `page.locator()` calls. This means when the UI changes, you update one file.

**Upload API mock:**  
`page.route('**/api/upload/chunk**', ...)` intercepts at the browser network level. The fixture sets a success mock. Tests that need failure call `page.route()` again — Playwright uses LIFO order so the later handler wins.

**Key locator decisions:**

| Element | Locator strategy | Reason |
|---|---|---|
| Next button | `#btn-next-step` | Stable ID; text "بعدی" could change |
| Caption textarea | `#caption-textarea-input` | Stable ID |
| Gallery cells | `galleryContainer.locator('img')` | Only real cells have `<img>`; placeholders don't |
| Gallery counter | `getByText(/از [1-9]\d* انتخاب شده/)` | Regex matches when uploadedCount ≥ 1 |
| Toast | `getByText('فقط JPG، PNG و WebP مجاز است')` | Exact Persian text from constants |

**`TINY_PNG` buffer:**  
A real 1×1 transparent PNG in base64. Playwright's `setInputFiles` accepts `{ name, mimeType, buffer }` — no real file path needed. The mimeType determines what `file.type` returns in the browser, which is what `validateBatch` checks.

---

## Quick reference — the full data flow

```
User picks file from native gallery
        │
        ▼
onChange → media.addFiles(files)
        │
        ├─ validateBatch()         rejects: heic, bmp, gif, >10MB
        │                          → toast if any rejected
        │
        ├─ buildMediaItem()        File → MediaItem { id, localUrl, status:'queued' }
        │
        ├─ mediaStore.addItems()   renders thumbnails immediately
        │
        └─ p-limit enqueues uploadOne(id, file)
                │
                ▼  (when a slot opens, max 3 concurrent)
        chunkStrategy.upload()
                │
                ├─ POST /api/upload/chunk × N chunks
                ├─ _setProgress(id, pct) → progress bar
                └─ (on last chunk) returns CDN url
                        │
                        ▼
        _setUploaded(id, url)
                        │
                        └─ status='uploaded', file=null, uploadedUrl=url
                                │
                                ▼
                        User taps thumbnail → toggleSelected(id)
                                │
                                ▼
                        User clicks Next → phase = 'details'
                                │
                                ▼
                        User fills caption → clicks Share
                                │
                                ▼
                        handleNext() validates caption
                        collects uploadedUrls from selectedIds
                        submitPost.mutate({ caption, mediaUrls })
                                │
                                ├─ isPending → Share button shows spinner
                                │
                                ▼
                        POST /api/posts { caption, mediaUrls }
                                │
                                ├─ onError  → toast.error(...)  ← user stays on page
                                │
                                └─ onSuccess → onNavigate('pending-posts') → router.back()
```

---

## Common questions

**Why is there no "Start Upload" button?**  
Uploads begin the moment the user picks files. This reduces total time-to-post — by the time the user writes a caption, uploads are usually already done.

**Why does the Share button call a mutation instead of navigating directly?**  
Two reasons. First, `POST /api/posts` must succeed before the user is sent to the waiting list — if the server rejects it, the user should stay on the form and see an error toast. Second, uploads may theoretically still be in progress when the user clicks Share (if they typed very fast); in that case the server call would be missing URLs. The mutation only sends `uploadedUrl` values collected from `selectedIds`, which are guaranteed to exist because `toggleSelected` only works on `status === 'uploaded'` items.

**Why no `useEffect` for navigation?**  
Effects run because a component was *displayed*. Navigation after Share is a direct consequence of a *user action*. Putting it in an effect watching `allDone && phase === 'details'` had a real bug: if uploads were already complete when the user hit Next, the effect fired immediately on phase transition — before the caption could be typed. The fix was to put navigation in `onSuccess`, which only fires after the user explicitly clicks Share and the server responds.

**Why `p-limit` instead of a custom state machine?**  
A custom queue manager needs to track `activeCount`, a `queue` array, and terminal state manually — ~170 lines across 4 files. `p-limit` handles all of that in ~560 bytes. The only thing the custom manager added was `terminalIds` to guard against double-fire; with `p-limit`, the `AbortController` abort flag serves the same purpose and the guard in `uploadOne` (`if (!ctrl || ctrl.signal.aborted) return`) is 2 lines.

**Why a factory function instead of a class for `createChunkStrategy`?**  
A factory keeps the implementation pure and injectable: pass `jest.fn()` as `fetcher` in tests and you get deterministic HTTP responses without mocking `window.fetch` globally.

**Why no `useCallback` or `useMemo`?**  
This project runs React Compiler (`babel-plugin-react-compiler`). The compiler automatically memoizes functions and values. Adding manual memos would either duplicate work or fight the compiler. Never add them.

**Why no `forwardRef`?**  
React 19 accepts `ref` as a normal prop. `forwardRef` is deprecated and removed from this codebase.

**What is `graphify`?**  
A knowledge graph tool. Run `rtk graphify query "your question"` before exploring source files — it surfaces the relevant nodes and edges in seconds, much faster than grepping.
