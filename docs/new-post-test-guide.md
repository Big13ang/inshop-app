# New Post Image Selection — Comprehensive Test Guide

This guide establishes the comprehensive test specification for the image selection and upload workflow in the post creation flow (`/app/posts/new`). It covers all functional requirements, client-side validation rules, binary header parsing, concurrency controls, state synchronization, and edge cases.

---

## 1. Architecture & Components Under Test

The media selection subsystem consists of the following modules:

### Presentation Layer

- [`AddPostClientWrapper.tsx`](../features/posts/new/AddPostClientWrapper.tsx) — Client boundary entry wrapper rendered by the Next.js page route (`/app/posts/new`).
- [`AddPostView.tsx`](../features/posts/new/AddPostView.tsx) — Top-level view container managing the file input ref, responsive MIME type (`accept`), and upload session initialization.
- [`AddPostBody.tsx`](../features/posts/new/components/AddPostBody.tsx) — Body switch renderer alternating between `SelectMediaPhaseView` and `PostDetailsPhaseView`.
- [`SelectMediaPhaseView.tsx`](../features/posts/new/components/SelectMediaPhaseView.tsx) — Main phase layout hosting the preview slider, seller banner, and gallery grid.
- [`SellerPanelBanner.tsx`](../features/posts/new/components/SellerPanelBanner.tsx) — Informational seller onboarding banner displayed at the top of the selection phase.
- [`SelectedGallery.tsx`](../features/posts/new/components/SelectedGallery.tsx) — 3-column media grid with empty states, image counter (`N/10 تصویر`), and selection handlers.
- [`GalleryCell.tsx`](../features/posts/new/components/GalleryCell.tsx) — Single thumbnail item displaying upload status overlays, selection borders, and order badges.
- [`SelectedMediaSlider.tsx`](../features/posts/new/components/SelectedMediaSlider.tsx) — Top carousel preview showing only selected items sorted by order, with active index clamping.
- [`StatusOverlay.tsx`](../features/posts/new/components/StatusOverlay.tsx) — Radial SVG upload progress, queued clock icons, and failed retry triggers.
- [`DeleteMediaButton.tsx`](../features/posts/new/components/DeleteMediaButton.tsx) & [`DeleteImageDialog.tsx`](../features/posts/new/components/DeleteImageDialog.tsx) — Deletion confirmation drawer dialog with server synchronization.
- [`SelectPhaseFooter.tsx`](../features/posts/new/components/SelectPhaseFooter.tsx) — Footer gating "Add" and "Next" buttons based on loading, validation, and pending states.

### Business Logic & State

- [`mediaStore.ts`](../features/posts/new/services/mediaStore.ts) — Zustand store managing `mediaList`, `phase`, `isValidating`, `uploadSessionId`, and blob URL memory cleanup.
- [`uploadSession.ts`](../features/posts/new/services/uploadSession.ts) — React Query hook creating and caching the backend `uploadSessionId`.
- [`reorderItems.ts`](../features/posts/new/utils/reorderItems.ts) — Immutable selection toggle and sequence re-indexing utility.
- [`uploadPipeline.ts`](../features/posts/new/services/uploadPipeline.ts) — Orchestration pipeline handling quota slicing, validation, and TUS upload queuing with concurrency limits.
- [`validateOne.ts`](../features/posts/new/services/validateOne.ts) & [`validateBatch.ts`](../features/posts/new/services/validateBatch.ts) — File size checks, dimension constraints, and batch execution pool.
- [`headerParser.ts`](../features/posts/new/services/headerParser.ts) — Binary parser inspecting magic bytes, EXIF orientation tags, and WebP VP8X animation flags.
- [`constants.ts`](../features/posts/new/constants.ts) & [`types.ts`](../features/posts/new/types.ts) — Constants (e.g. `MAX_IMAGES = 10`), Persian UI strings, and media item models.

---

## 2. The Testing Pyramid Strategy

```
             ┌──────────────────────────┐
             │        E2E (Few)         │  Playwright: Full user flow, real browser
             ├──────────────────────────┤
             │ Component / Int (Some)   │  RTL + userEvent + MSW: State, DOM, UI triggers
             ├──────────────────────────┤
             │        Unit (Many)       │  Jest: Pure logic, binary parsers, validators
             └──────────────────────────┘
```

- **Unit Tests (Fast, No DOM)**: Binary header inspection, dimension calculation, EXIF rotation parsing, quota slicing, and selection reorder algorithms.
- **Component / Integration Tests (RTL + MSW)**: File selection events, status badge transitions, modal confirmations, store interactions, and footer button disabled states.
- **End-to-End Tests (Playwright)**: Full upload journey from file picking to caption phase transition in real Chromium/WebKit browsers.

---

## 3. Test Cases Matrix

### Category 1: File Input & Platform Native Behavior

| ID | Case Title | Layer | Setup / Preconditions | Action / Trigger | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INP-01** | **Mobile MIME filter (`image/*`)** | Component | User agent mocked as mobile (`isMobile() === true`) | Render [`AddPostView`](../features/posts/new/AddPostView.tsx) | `<input type="file">` has `accept="image/*"` to trigger native mobile photo picker / camera. |
| **INP-02** | **Desktop MIME filter** | Component | User agent mocked as desktop (`isMobile() === false`) | Render [`AddPostView`](../features/posts/new/AddPostView.tsx) | `<input type="file">` has `accept="image/jpeg,image/png,image/webp"`. |
| **INP-03** | **Trigger file picker via "Add" button** | Component | Fresh page load | Click footer button (`#btn-trigger-picker`) | Programmatic `.click()` is invoked on the hidden file input ref. |
| **INP-04** | **Input value reset after selection** | Component | 1 image previously selected | Select the exact same file again | `e.target.value` is cleared to `""` on change, ensuring the browser triggers `onChange` even for the identical file twice consecutively. |
| **INP-05** | **User cancels file picker** | Component | File picker opened | Cancel file picker dialog (`files: []`) | No store changes, no errors, UI remains completely unchanged. |

---

### Category 2: File Validation & Binary Header Inspection

These test cases target [`validateOne.ts`](../features/posts/new/services/validateOne.ts) and [`headerParser.ts`](../features/posts/new/services/headerParser.ts).

| ID | Case Title | Layer | Input / File Spec | Expected Outcome | Edge Case / Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VAL-01** | **Valid JPEG (>= 1080x1080, < 10MB)** | Unit | Valid JPEG binary with 1200x1200px and 2MB size | Returns `null` (accepted), marks valid, moves to queued. | Standard happy path. |
| **VAL-02** | **Valid PNG (>= 1080x1080, < 10MB)** | Unit | Valid PNG signature (`89 50 4E 47`) and dimensions | Returns `null` (accepted). | Verifies PNG header parsing. |
| **VAL-03** | **Valid Static WebP** | Unit | Valid VP8 or static VP8X WebP (>= 1080x1080) | Returns `null` (accepted). | Standard WebP support. |
| **VAL-04** | **Animated WebP (VP8X animation bit set)** | Unit | WebP with VP8X header and bit 1 flag set | Rejected with `REJECTION_CODES.INVALID_FORMAT` and `animatedWebpNotAllowed` message. | Prevents animated stickers/GIFs uploaded as WebP. |
| **VAL-05** | **File size exceeding 10MB limit** | Unit | Valid image file with size `10 * 1024 * 1024 + 1` bytes | Rejected immediately with `FILE_TOO_LARGE` without reading buffer. | Prevents unnecessary client-side ArrayBuffer parsing for oversized files. |
| **VAL-06** | **Exact boundary 10MB file** | Unit | Valid image with size exactly `10 * 1024 * 1024` bytes | Accepted (boundary condition: `<= 10MB`). | Boundary testing. |
| **VAL-07** | **Resolution below 1080px (Width)** | Unit | 1079 x 1200 px image | Rejected with `RESOLUTION_TOO_LOW` (`resolutionTooSmall`). | Enforces high quality store standards. |
| **VAL-08** | **Resolution below 1080px (Height)** | Unit | 1920 x 1079 px image | Rejected with `RESOLUTION_TOO_LOW`. | Both dimensions must satisfy `>= 1080`. |
| **VAL-09** | **Exact 1080x1080 boundary** | Unit | Exactly 1080 x 1080 px image | Accepted. | Boundary testing. |
| **VAL-10** | **JPEG EXIF Orientation swap (Orientations 5–8)** | Unit | Portrait JPEG shot as 800x1200 with EXIF orientation 6 (90° rotation) | Transposed dimensions become 1200x800, fails height requirement (<1080). | EXIF rotation metadata changes effective display dimensions. |
| **VAL-11** | **JPEG EXIF Orientation normal (Orientations 1–4)** | Unit | 1200x1200 with orientation 1 | Accepted without dimension swap. | Normal EXIF orientation. |
| **VAL-12** | **Corrupt JPEG marker length (< 2 bytes)** | Unit | JPEG SOI followed by invalid marker length (e.g. 0 or 1) | Rejection with `INVALID_FORMAT` (`corrupt_marker`). | Prevents infinite loop / index overrun. |
| **VAL-13** | **Malformed JPEG EXIF segment loop (> 500 markers)** | Unit | Specially crafted binary with > 500 consecutive markers | Stops parsing, returns `corrupt_marker` error. | Guard against DoS / CPU lockup. |
| **VAL-14** | **Unsupported format: HEIC / HEIF** | Unit | ISO base media file with brand `heic`, `heix`, `mif1` | Rejected with `HEIC_NOT_SUPPORTED` (`heicNotSupported`). | Explicit unsupported format message. |
| **VAL-15** | **Unsupported format: AVIF** | Unit | ISO base media file with brand `avif` or `avis` | Rejected with `HEIC_NOT_SUPPORTED`. | Unsupported modern format. |
| **VAL-16** | **Disguised file (Polyglot / Renamed `.exe` or `.txt` to `.jpg`)** | Unit | Text file renamed to `photo.jpg` | Magic bytes mismatch, fails `parseImageHeader`, rejected with `mimeError`. | Security & MIME spoofing protection. |
| **VAL-17** | **0-byte empty file** | Unit | Empty file (`size === 0`) | Gracefully handled without runtime crash. | Defensive edge case. |
| **VAL-18** | **Unreadable file slice (Disk/IO failure)** | Unit | Mock `file.slice().arrayBuffer()` throwing Error | Returns `readError` without uncaught exception. | Handled via [`Result.err`](../lib/utils/result.ts). |

---

### Category 3: Batch Limits, Quotas & Array Slicing

These test cases target [`uploadPipeline.ts`](../features/posts/new/services/uploadPipeline.ts) and [`validateBatch.ts`](../features/posts/new/services/validateBatch.ts).

| ID | Case Title | Layer | Initial Store State | User Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QUO-01** | **Upload within quota (e.g. 3 images)** | Component | 0 images in store | Select 3 valid images | All 3 added to store, validating spinner shown, then all queued. |
| **QUO-02** | **Upload reaching exact quota (10 images)** | Component | 0 images in store | Select 10 valid images | All 10 added. "Add" button becomes disabled (`isAtLimit`). Counter shows `10/10 تصویر` in red. |
| **QUO-03** | **Upload exceeding quota from empty (12 images)** | Component | 0 images in store | Select 12 images | First 10 added. Sliced excess 2 images. Toast notification: `maxImagesReached(10)`. |
| **QUO-04** | **Incremental upload exceeding remaining quota** | Component | 8 images already in store | Select 4 new images | Only 2 images added (8 + 2 = 10). Toast info: `maxImagesReached(2)`. Remaining 2 discarded. |
| **QUO-05** | **Upload attempt when already at limit (10 images)** | Component | 10 images in store | Trigger file picker | Blocked. Toast error: `maxImagesLimit(10)`. Store unchanged. |
| **QUO-06** | **Batch with mixed valid and invalid files** | Integration | 0 images in store | Select 3 files: [Valid 1200x1200, Invalid 500x500, Valid 1400x1400] | Invalid file removed from store with toast error (`imageUnacceptable`). Valid 2 items remain queued and uploaded. |
| **QUO-07** | **Concurrent batch validation (`validateBatch`)** | Unit | 10 files | Run `validateBatch(files)` | Runs with max concurrency of 5 (`validateLimit = pLimit(5)`). AbortSignal cancels remaining items. |

---

### Category 4: Upload Pipeline, Concurrency & State Lifecycle

These test cases target [`uploadPipeline.ts`](../features/posts/new/services/uploadPipeline.ts) and [`StatusOverlay.tsx`](../features/posts/new/components/StatusOverlay.tsx).

| ID | Case Title | Layer | Setup / Scenario | Expected State & UI Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **UPL-01** | **Session not ready / pending** | Component | `useUploadSession` returns `{ isPending: true }` | Next and Add buttons disabled with loading state; file picker trigger prevented until session ID arrives. |
| **UPL-02** | **Validation in progress (`isValidating`)** | Component | Batch validation running | Next button shows spinning loader icon, disabled. Add button disabled. |
| **UPL-03** | **State lifecycle progression** | Integration | Select 1 valid file | Item progresses: `pending` (local blob URL) ➔ `queued` (order assigned) ➔ `uploading` (progress ring active) ➔ `uploaded` (overlay removed, serverMediaId saved). |
| **UPL-04** | **Concurrency throttle (Max 3 parallel)** | Integration | Select 6 valid images simultaneously | Exactly 3 items upload concurrently (`uploading`). Remaining 3 stay `queued` until an active slot finishes. |
| **UPL-05** | **Upload progress indicator** | Component | TUS progress callback fires `45%` | [`StatusOverlay`](../features/posts/new/components/StatusOverlay.tsx) renders circular SVG progress with text `45٪`. |
| **UPL-06** | **Upload success & Server ID extraction** | Integration | TUS upload returns URL `https://.../files/media-xyz123` | Item marked `status: 'uploaded'`. `serverMediaId` parsed as `'media-xyz123'`. |
| **UPL-07** | **Upload failure: Server error** | Integration | TUS upload fails with 500 error | Item marked `status: 'failed'`. [`StatusOverlay`](../features/posts/new/components/StatusOverlay.tsx) displays red badge with label `خطا` and "تلاش دوباره" (Retry) link. Toast displays `failedToUpload`. |
| **UPL-08** | **Upload failure: Server rejected resolution** | Integration | TUS upload returns error containing `resolution` or `1080` | Toast displays specific Persian message: `resolutionTooSmall`. |
| **UPL-09** | **Retry failed upload** | Component | Item in `status: 'failed'` | Clicking "تلاش دوباره" does not propagate cell selection toggle. Retries upload for this item. |

---

### Category 5: Gallery Selection, Reordering & Badges

These test cases target [`SelectedGallery.tsx`](../features/posts/new/components/SelectedGallery.tsx), [`GalleryCell.tsx`](../features/posts/new/components/GalleryCell.tsx), and [`reorderItems.ts`](../features/posts/new/utils/reorderItems.ts).

| ID | Case Title | Layer | Precondition | User Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEL-01** | **Empty gallery state** | Component | `mediaList: []` | Render [`SelectedGallery`](../features/posts/new/components/SelectedGallery.tsx) | Displays 6 dashed placeholder cards, empty image icon, and Persian helper text: «با دکمه اضافه کردن در پایین صفحه...». |
| **SEL-02** | **Click non-uploaded item (uploading / pending)** | Component | 1 item with `status: 'uploading'` | Click on [`GalleryCell`](../features/posts/new/components/GalleryCell.tsx) | No selection change (`handleCellClick` guards `if (item.status === 'uploaded')`). Cannot select unuploaded media. |
| **SEL-03** | **Select first uploaded item** | Component | 1 item uploaded (`order: null`) | Click on [`GalleryCell`](../features/posts/new/components/GalleryCell.tsx) | `order` becomes `1`. Badge displays `1`. Active border (`border-2 border-primary`) and `bg-white/10` overlay appear. |
| **SEL-04** | **Sequential selection of multiple items** | Unit / Comp | Items A, B, C uploaded (`order: null`) | Click A, then C, then B | Order assignments: A = 1, C = 2, B = 3. Badges display 1, 2, 3 respectively. |
| **SEL-05** | **Deselect first item (Shift down test)** | Unit / Comp | A (order 1), B (order 2), C (order 3) | Click A | A becomes `order: null` (unselected). B shifts `2 ➔ 1`. C shifts `3 ➔ 2`. Badges update automatically. |
| **SEL-06** | **Deselect middle item (Shift down test)** | Unit / Comp | A (order 1), B (order 2), C (order 3) | Click B | B becomes `order: null`. A remains `1`. C shifts `3 ➔ 2`. |
| **SEL-07** | **Deselect last item** | Unit / Comp | A (order 1), B (order 2) | Click B | B becomes `order: null`. A remains `1`. |
| **SEL-08** | **Re-select previously deselected item** | Unit / Comp | A (order 1), B (order null) | Click B | B receives `order: 2` (`maxOrder + 1`). |
| **SEL-09** | **Non-existent item reorder safety** | Unit | `reorderItems(mediaList, 'non-existent-id')` | Call function | Returns identical array reference without crashing. |

---

### Category 6: Selected Media Slider

These test cases target [`SelectedMediaSlider.tsx`](../features/posts/new/components/SelectedMediaSlider.tsx).

| ID | Case Title | Layer | Precondition | Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SLD-01** | **Empty slider view** | Component | 0 items selected | Render [`SelectedMediaSlider`](../features/posts/new/components/SelectedMediaSlider.tsx) | Shows empty container with dashed icon and text: «تصویری انتخاب نشده». |
| **SLD-02** | **Slider order synchronization** | Component | Items in store: A (order: 2), B (order: 1) | Render [`SelectedMediaSlider`](../features/posts/new/components/SelectedMediaSlider.tsx) | Slides are strictly sorted by `order` (Slide 1 is B, Slide 2 is A). |
| **SLD-03** | **Slide counter label** | Component | 3 items selected, on 1st slide | Slide to 2nd item | Badge changes from `فایل ۱ از ۳` to `فایل ۲ از ۳`. |
| **SLD-04** | **Safe index clamping on deselection** | Component | 3 items selected, active slide is index 2 (last slide) | User deselects the 3rd item in gallery | `getSafeIndex` clamps `activeIndex` to 1 (maxIndex = 1). Prevents white screen / out-of-bounds index crash. |
| **SLD-05** | **Delete button visibility rule** | Component | Only 1 image selected | View top slider | Delete button is hidden (`mediaList.length > 1` rule). |
| **SLD-06** | **Delete button shown for multiple images** | Component | 2 or more images selected | View top slider | Delete button (`#btn-delete-media-...`) is visible on the currently active slide. |
| **SLD-07** | **Compact mode prop** | Component | `isCompact={true}` | Render slider | Applies compact border/shadow variants; delete button is suppressed. |

---

### Category 7: Media Deletion Flow & Server Synchronization

These test cases target [`DeleteMediaButton.tsx`](../features/posts/new/components/DeleteMediaButton.tsx) and [`DeleteImageDialog.tsx`](../features/posts/new/components/DeleteImageDialog.tsx).

| ID | Case Title | Layer | Scenario | Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEL-01** | **Open confirmation dialog** | Component | 2 images selected | Click trash icon on active slide | [`DeleteImageDialog`](../features/posts/new/components/DeleteImageDialog.tsx) opens with title «حذف تصویر» and question «آیا از حذف این تصویر اطمینان دارید؟». |
| **DEL-02** | **Cancel deletion** | Component | Dialog open | Click «انصراف» (`#btn-reject-delete`) or backdrop | Dialog closes, item remains in store, no deletion mutation triggered. |
| **DEL-03** | **Delete local-only / unuploaded item** | Component | Item has no `serverMediaId` | Confirm delete | Item immediately removed from store, dialog closes, no backend API called. |
| **DEL-04** | **Delete server-uploaded item (Success)** | Integration | Item has `serverMediaId: 'img-1'` and valid session | Click «حذف» (`#btn-confirm-delete`) | `useDeleteUploadSessionPhoto` mutation called with `{ mediaId: 'img-1', uploadSessionId }`. Spinner shown. On success, item removed from store and dialog closes. |
| **DEL-05** | **Delete server-uploaded item (Failure)** | Integration | API returns 500 error | Confirm delete | Mutation fails, error toast shown, item is **not** removed from store, dialog closes on settlement. |
| **DEL-06** | **Object URL cleanup on delete** | Unit / Comp | Item has `previewUrl: 'blob:...'` | Delete item via `store.removeItem(id)` | `URL.revokeObjectURL` is invoked with the item's blob URL to prevent browser memory leaks. |

---

### Category 8: Footer Gating & Step Progression

These test cases target [`SelectPhaseFooter.tsx`](../features/posts/new/components/SelectPhaseFooter.tsx).

| ID | Case Title | Layer | State Condition | Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FOT-01** | **Next button disabled during pending uploads** | Component | At least 1 item has status `queued`, `uploading`, or `pending` | Inspect Next button | Button is disabled with spinning loader (`Loader2`). Click has no effect. |
| **FOT-02** | **Next button disabled while session is loading** | Component | `isSessionLoading === true` | Inspect Next button | Button is disabled. |
| **FOT-03** | **Next button blocked when no image selected** | Component | 2 images uploaded, but both have `order: null` (unselected) | Click «بعدی» (`#btn-next-step`) | Does **not** advance. Triggers warning toast: `alertNoImages` («حداقل یک تصویر انتخاب کنید»). |
| **FOT-04** | **Next button advances when valid** | Component | 1+ images selected (`order !== null`), 0 pending uploads | Click «بعدی» (`#btn-next-step`) | `mediaStore.setPhase('details')` is called, advancing user to caption/product details form. |
| **FOT-05** | **Add button disabled at 10 images** | Component | 10 images in store (`mediaList.length === 10`) | Inspect Add button | Button is disabled (`isAtLimit`). |
| **FOT-06** | **Add button enabled below 10 images** | Component | 9 images in store, session ready, not validating | Inspect Add button | Button is enabled. Clicking triggers file input picker. |

---

### Category 9: Non-Functional, Security & Edge Cases

| ID | Case Title | Scenario / Input | Expected Behavior / Guardrail |
| :--- | :--- | :--- | :--- |
| **EDG-01** | **Memory Leak on Store Reset / Page Unmount** | User selects 5 images (5 blob URLs created) and leaves the page / resets store. | `store.reset()` iterates over all items and calls `URL.revokeObjectURL(item.previewUrl)` for every item. |
| **EDG-02** | **Persian & Unicode File Names** | File named `تصویر-محصول-شماره-۱ (کفش).jpeg` | File name correctly handled in toast errors, TUS headers, and UI without encoding/mojibake errors. |
| **EDG-03** | **Long File Names (> 255 chars)** | File named with 300 characters | Name truncated cleanly in toasts without overflowing the UI. |
| **EDG-04** | **Zero-Byte File Injection** | Empty File object passed | Validated cleanly; rejected or ignored without unhandled promise rejection. |
| **EDG-05** | **Rapid Double-Click / Race Condition on Add** | User clicks Add button repeatedly in 100ms | Input triggers once; multiple simultaneous dialog openings prevented by browser/state locking. |
| **EDG-06** | **Offline / Network Drop Mid-Upload** | Network disconnects while 2 images are at 50% | TUS client triggers `onError`, state transitions to `failed`, retry button shown. Page remains responsive. |
| **EDG-07** | **RTL Layout Integrity** | Direction `dir="rtl"` on page | Gallery grid maintains LTR image order (`dir="ltr"` on grid container) so order 1, 2, 3 flows correctly left-to-right, while text headers and dialogs stay Persian RTL. |

---

## 4. Persian Error & Toast Verification Checklist

When validating notifications, match against canonical constants defined in [`@/lib/constants/errors`](../lib/constants/errors.ts) and [`constants.ts`](../features/posts/new/constants.ts):

| Trigger Condition | Error Constant / Function | Persian Message String |
| :--- | :--- | :--- |
| No images selected on Next | `ERROR_MESSAGES.validation.noImages` | `حداقل یک تصویر برای محصول خود انتخاب کنید` |
| Over 10MB file | `ERROR_MESSAGES.upload.imageSizeLimit` | `حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد` |
| Unsupported format / Corrupt | `ERROR_MESSAGES.upload.imageFormatLimit` | `فرمت تصویر معتبر نیست. فرمت‌های مجاز: JPEG, PNG, WebP` |
| Low resolution (< 1080px) | `ERROR_MESSAGES.upload.resolutionTooSmall` | `کیفیت تصویر پایین است. حداقل ابعاد مجاز: ۱۰۸۰ در ۱۰۸۰ پیکسل` |
| HEIC format selected | `ERROR_MESSAGES.upload.heicNotSupported` | `فرمت HEIC پشتیبانی نمی‌شود. لطفاً تصویر را با فرمت JPEG یا PNG ارسال کنید` |
| Animated WebP selected | `ERROR_MESSAGES.upload.animatedWebpNotAllowed` | `تصاویر متحرک مجاز نیستند` |
| Exceeding remaining quota | `ERROR_MESSAGES.upload.maxImagesReached(count)` | `تنها {count} تصویر دیگر می‌توانید اضافه کنید` |
| Attempting upload at 10 images | `ERROR_MESSAGES.upload.maxImagesLimit(10)` | `حداکثر ۱۰ تصویر می‌توانید انتخاب کنید` |
| Upload network failure | `ERROR_MESSAGES.upload.failedToUpload(fileName)` | `بارگذاری تصویر {fileName} با خطا مواجه شد` |

---

## 5. Implementation Recommendations

1. **Colocate Component Tests**:
   - Place component tests next to their respective components:
     - `features/posts/new/components/__tests__/SelectedGallery.test.tsx`
     - `features/posts/new/components/__tests__/SelectedMediaSlider.test.tsx`
     - `features/posts/new/components/__tests__/SelectPhaseFooter.test.tsx`
     - `features/posts/new/components/__tests__/DeleteMediaButton.test.tsx`
2. **Colocate Unit Tests**:
   - `features/posts/new/services/__tests__/validateOne.test.ts`
   - `features/posts/new/services/__tests__/headerParser.test.ts`
   - `features/posts/new/services/__tests__/uploadPipeline.test.ts`
3. **Mocking Boundaries**:
   - Mock network endpoints via **MSW v2** (`http.post`, `http.delete`, TUS endpoints).
   - Never mock internal hooks or local child components in RTL tests.
   - Use `jest.spyOn(URL, 'createObjectURL')` and `jest.spyOn(URL, 'revokeObjectURL')` to verify memory leak prevention.
