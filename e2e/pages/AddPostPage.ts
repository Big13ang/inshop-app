/**
 * Page Object Model — AddPostPage
 *
 * QA principle: All locators and user actions live here. Test files describe
 * WHAT to verify; this file describes HOW to interact with the Add New Post UI.
 *
 * The Add Post flow has two phases:
 *   select  — gallery + preview slider, Next / Add buttons in footer
 *   details — caption form, Share button in footer
 *
 * Upload API is intercepted via page.route() so tests don't require a real backend.
 * Call mockUploadApi() BEFORE goto() so the route is registered before any fetches.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { text } from '../../features/posts/new/constants';

/** 1×1 transparent PNG — small, valid, passes image/* MIME-type validation. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** 11 MB zero-filled buffer — exceeds the 10 MB image size limit. */
export const OVERSIZED_PNG = Buffer.alloc(11 * 1024 * 1024);

export class AddPostPage {
  readonly page: Page;

  // ── Footer action buttons ─────────────────────────────────────────────────
  // IDs set in AddPostFooter.tsx — stable regardless of translation changes.
  readonly nextButton:  Locator;
  readonly addButton:   Locator;
  readonly shareButton: Locator;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly headerTitle: Locator;
  readonly backButton:  Locator;

  // ── Hidden file input ─────────────────────────────────────────────────────
  // Playwright can set files on hidden inputs via setInputFiles().
  readonly fileInput: Locator;

  // ── Gallery ───────────────────────────────────────────────────────────────
  readonly galleryContainer: Locator;

  // ── Details form ──────────────────────────────────────────────────────────
  readonly captionTextarea: Locator;

  // ── Delete confirmation dialog ────────────────────────────────────────────
  readonly confirmDeleteButton: Locator;
  readonly rejectDeleteButton:  Locator;

  // ── Preview slider (PostSlider) ───────────────────────────────────────────
  readonly sliderContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    this.headerTitle     = page.locator('header').getByText(text.headerTitle);
    this.backButton      = page.locator('#add-post-back-btn');
    this.nextButton      = page.locator('#btn-next-step');
    this.addButton       = page.locator('#btn-trigger-picker');
    this.shareButton     = page.locator('#btn-share-post');
    this.fileInput       = page.locator('input[type="file"][multiple]');
    this.galleryContainer = page.locator('#selected-gallery-container');
    this.captionTextarea  = page.locator('#caption-textarea-input');
    this.confirmDeleteButton = page.locator('#btn-confirm-delete');
    this.rejectDeleteButton  = page.locator('#btn-reject-delete');
    this.sliderContainer     = page.locator('#post-slider-container');
  }

  // ── Route mocking ─────────────────────────────────────────────────────────

  /**
   * Intercept the tus protocol upload requests and return instant success
   * responses. Must be called BEFORE goto() so the mocks are active before
   * the page loads.
   *
   * tus-js-client drives three request types against the upload endpoint:
   *   POST   /api/upload      — creation; reply 201 + Location header
   *   HEAD   /api/upload/:id  — resume probe; reply current Upload-Offset
   *   PATCH  /api/upload/:id  — chunk write; reply the new Upload-Offset
   *
   * Offsets are tracked per id so HEAD/PATCH stay consistent across chunks
   * within a single test, mirroring mocks/handlers.ts (the Jest/MSW mocks).
   */
  uploadOffsets = new Map<string, number>();

  async mockUploadApi() {
    this.uploadOffsets.clear();
    await this.page.route('**/api/upload', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.uploadOffsets.set(id, 0);
      return route.fulfill({
        status: 201,
        headers: { Location: `/api/upload/${id}`, 'Tus-Resumable': '1.0.0' },
      });
    });
    await this.page.route('**/api/upload/*', async (route) => {
      const request = route.request();
      const id = new URL(request.url()).pathname.split('/').pop()!;
      if (request.method() === 'HEAD') {
        const offset = this.uploadOffsets.get(id) ?? 0;
        return route.fulfill({
          status: 200,
          headers: {
            'Upload-Offset': String(offset),
            'Tus-Resumable': '1.0.0',
          },
        });
      }
      if (request.method() === 'PATCH') {
        const startOffset = this.uploadOffsets.get(id) ?? 0;
        const body = request.postDataBuffer();
        const offset = startOffset + (body?.byteLength ?? 0);
        this.uploadOffsets.set(id, offset);
        return route.fulfill({
          status: 204,
          headers: { 'Upload-Offset': String(offset), 'Tus-Resumable': '1.0.0' },
        });
      }
      return route.continue();
    });
  }

  /**
   * Override the upload mock to simulate a server error.
   * Because Playwright matches routes in LIFO order, calling this AFTER
   * mockUploadApi() will take priority for subsequent upload requests.
   */
  async mockUploadApiWithError() {
    await this.page.route('**/api/upload', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
  }

  /**
   * Override the upload mock to introduce a configurable delay before success.
   * Useful for verifying the progress loader appears during an in-flight upload.
   */
  async mockSlowUploadApi(delayMs = 2_000) {
    await this.page.route('**/api/upload', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await new Promise((r) => setTimeout(r, delayMs));
      const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.uploadOffsets.set(id, 0);
      return route.fulfill({
        status: 201,
        headers: { Location: `/api/upload/${id}`, 'Tus-Resumable': '1.0.0' },
      });
    });
  }

  /**
   * Intercept upload creation and fail only for the given filenames
   * (matched via the tus `Upload-Metadata` header, which tus-js-client
   * encodes as base64 `key value,key value` pairs). Succeeds for everything
   * else. Used to verify one failed upload doesn't block or cancel the others.
   */
  async mockUploadApiFailingFor(filenames: string[]) {
    await this.page.route('**/api/upload', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      const metadataHeader = route.request().headers()['upload-metadata'] ?? '';
      const filename = metadataHeader
        .split(',')
        .map((pair) => pair.trim().split(' '))
        .find(([key]) => key === 'filename');
      const decoded = filename ? Buffer.from(filename[1], 'base64').toString('utf-8') : undefined;
      if (decoded && filenames.includes(decoded)) {
        return route.fulfill({ status: 500, body: 'Server Error' });
      }
      const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.uploadOffsets.set(id, 0);
      return route.fulfill({
        status: 201,
        headers: { Location: `/api/upload/${id}`, 'Tus-Resumable': '1.0.0' },
      });
    });
  }

  /** Upload an oversized image (>10 MB) that the client validator rejects. */
  async uploadOversizedImage() {
    await this.uploadFiles([{ name: 'big.png', mimeType: 'image/png', buffer: OVERSIZED_PNG }]);
  }

  // ── Publish (POST /api/posts) mocking ─────────────────────────────────────

  /** Number of POST /api/posts requests observed since the last mock* call. Used to assert no duplicate submissions fire. */
  publishRequestCount = 0;

  /** Intercept POST /api/posts and return an instant success response. */
  async mockPublishApi() {
    this.publishRequestCount = 0;
    await this.page.route('**/api/posts', (route) => {
      this.publishRequestCount += 1;
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'post_1' }) });
    });
  }

  /** Override the publish mock to simulate a server error. LIFO routing makes this win over mockPublishApi(). */
  async mockPublishApiWithError() {
    this.publishRequestCount = 0;
    await this.page.route('**/api/posts', (route) => {
      this.publishRequestCount += 1;
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
  }

  /** Override the publish mock to introduce a configurable delay before success — for asserting the loading state and duplicate-submission guard. */
  async mockSlowPublishApi(delayMs = 2_000) {
    this.publishRequestCount = 0;
    await this.page.route('**/api/posts', async (route) => {
      this.publishRequestCount += 1;
      await new Promise((r) => setTimeout(r, delayMs));
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'post_1' }) });
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /** Navigate to /app/posts/new and wait until footer buttons are interactive. */
  async goto() {
    await this.page.goto('/app/posts/new');
    await expect(this.nextButton).toBeVisible();
  }

  // ── File input ────────────────────────────────────────────────────────────

  /** Provide files to the hidden file input. */
  async uploadFiles(
    files: Array<{ name: string; mimeType: string; buffer: Buffer }>,
  ) {
    await this.fileInput.setInputFiles(files);
  }

  /**
   * Upload a single valid PNG and wait until the gallery reflects at least
   * one uploaded item. This is the standard "happy path" upload helper.
   */
  async uploadValidImage(name = 'photo.png') {
    await this.uploadFiles([{ name, mimeType: 'image/png', buffer: TINY_PNG }]);
    await this.waitForGalleryHasUploadedItem();
  }

  /** Upload a file with a MIME type that the validator rejects (triggers a toast). */
  async uploadInvalidFile(name = 'photo.heic') {
    await this.uploadFiles([{ name, mimeType: 'image/heic', buffer: TINY_PNG }]);
  }

  // ── Waits ─────────────────────────────────────────────────────────────────

  /**
   * Wait until at least one gallery item reaches "uploaded" status.
   *
   * GalleryCell.tsx exposes `data-status` on its root element — this reads
   * real component state directly instead of matching translated UI text
   * (which doesn't carry a per-item "uploaded" indicator string at all).
   */
  async waitForGalleryHasUploadedItem(timeout = 15_000) {
    await expect(
      this.galleryContainer.locator('[data-status="uploaded"]').first(),
    ).toBeVisible({ timeout });
  }

  /** Wait until exactly `n` gallery cells are marked selected (`data-selected="true"`). */
  async waitForSelectionCount(n: number) {
    await expect(
      this.galleryContainer.locator('[data-selected="true"]'),
    ).toHaveCount(n);
  }

  /** Wait until exactly `n` gallery cells have reached "uploaded" status. */
  async waitForUploadedCount(n: number, timeout = 5_000) {
    await expect(
      this.galleryContainer.locator('[data-status="uploaded"]'),
    ).toHaveCount(n, { timeout });
  }

  // ── Gallery interactions ──────────────────────────────────────────────────

  /**
   * Move the mouse to the centre of a locator, scrolling it into view and
   * verifying it isn't obscured first. Raw `boundingBox()` + `page.mouse`
   * reports DOM coordinates even when another element (e.g. the sticky
   * footer) sits on top at that scroll position, which silently clicks the
   * wrong thing — `hover()` runs Playwright's actionability checks first.
   */
  private async moveMouseTo(locator: Locator) {
    await locator.hover();
  }

  /**
   * Tap the Nth gallery cell (0-indexed, left→right, top→bottom) to toggle
   * its selection (or retry it, if failed). GalleryCell.tsx selects on
   * mouseup/touchend — not on a generic 'click' — so this drives a real
   * mousedown→mouseup sequence well under the 600ms long-press threshold,
   * rather than dispatching a synthetic event the component never listens for.
   */
  async clickGalleryCell(index: number) {
    const cell = this.galleryContainer.locator('div.cursor-pointer').nth(index);
    await this.moveMouseTo(cell);
    await this.page.mouse.down();
    await this.page.mouse.up();
  }

  /**
   * Long-press the Nth gallery cell (0-indexed) to open the DeleteImageDialog.
   * GalleryCell.tsx fires onLongPress via a real 600ms setTimeout started on
   * mousedown, so this must hold the mouse down for longer than that —
   * dispatching a synthetic event can't fake the elapsed wall-clock time.
   */
  async longPressGalleryCell(index: number, holdMs = 700) {
    const cell = this.galleryContainer.locator('div.cursor-pointer').nth(index);
    await this.moveMouseTo(cell);
    await this.page.mouse.down();
    await this.page.waitForTimeout(holdMs);
    await this.page.mouse.up();
  }

  /** Confirm removal in the DeleteImageDialog opened by longPressGalleryCell(). */
  async confirmDelete() { await this.confirmDeleteButton.click(); }

  /** Dismiss the DeleteImageDialog without removing the image. */
  async dismissDelete() { await this.rejectDeleteButton.click(); }

  // ── Preview slider interactions ───────────────────────────────────────────

  /** Focus the slider region and press an arrow key to navigate (PostSlider's keyboard handler). */
  async pressSliderArrow(key: 'ArrowLeft' | 'ArrowRight') {
    await this.sliderContainer.focus();
    await this.sliderContainer.press(key);
  }

  /**
   * Drag across the slider to trigger keen-slider's pointer-based swipe.
   * Each slide occupies the slider's full width (perView: 1), so the drag
   * must cross more than half of the *container* width — not just a
   * fraction of it — to pass keen-slider's snap threshold; a 50% drag lands
   * exactly on the boundary and snaps back. keen-slider also needs
   * incremental pointermove events (not a single jump) plus a brief pause
   * before release to register the swipe.
   */
  async swipeSlider(direction: 'left' | 'right') {
    const box = await this.sliderContainer.boundingBox();
    if (!box) throw new Error('Slider container has no bounding box');
    const startX = box.x + box.width * 0.9;
    const endX = box.x + box.width * 0.1;
    const y = box.y + box.height / 2;
    const [from, to] = direction === 'left' ? [startX, endX] : [endX, startX];

    await this.page.mouse.move(from, y);
    await this.page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await this.page.mouse.move(from + ((to - from) * i) / 10, y);
      await this.page.waitForTimeout(20);
    }
    await this.page.waitForTimeout(100);
    await this.page.mouse.up();
  }

  // ── Footer interactions ───────────────────────────────────────────────────

  async clickNext()  { await this.nextButton.click(); }
  async clickAdd()   { await this.addButton.click(); }
  async clickShare() { await this.shareButton.click(); }
  async clickBack()  { await this.backButton.click(); }

  // ── Caption form ──────────────────────────────────────────────────────────

  async fillCaption(value: string) { await this.captionTextarea.fill(value); }
  async clearCaption()             { await this.captionTextarea.clear(); }

  // ── Composite helpers ─────────────────────────────────────────────────────

  /**
   * Full path from fresh page to the details phase:
   *   1. Upload a valid image and wait for "uploaded" status.
   *   2. Click the first gallery cell to select it.
   *   3. Wait for the selection counter to confirm the tap registered.
   *   4. Click Next to advance to the details phase.
   *   5. Wait for the caption textarea to confirm the transition.
   */
  async advanceToDetailsPhase() {
    await this.uploadValidImage();
    await this.clickGalleryCell(0);
    await this.waitForSelectionCount(1);
    await this.clickNext();
    await expect(this.captionTextarea).toBeVisible();
  }

  /** From a fresh page: upload + select one image, fill a caption, and click Share. */
  async fillAndSubmitPost(caption = 'محصول جدید با کیفیت بالا') {
    await this.advanceToDetailsPhase();
    await this.fillCaption(caption);
    await this.clickShare();
  }

  // ── Phase assertions ──────────────────────────────────────────────────────

  /** Verify the select-phase footer (Next + Add visible; Share absent). */
  async assertOnSelectPhase() {
    await expect(this.nextButton).toBeVisible();
    await expect(this.addButton).toBeVisible();
    await expect(this.shareButton).not.toBeVisible();
  }

  /** Verify the details-phase footer (Share visible; Add absent). */
  async assertOnDetailsPhase() {
    await expect(this.captionTextarea).toBeVisible();
    await expect(this.shareButton).toBeVisible();
    await expect(this.addButton).not.toBeVisible();
  }
}
