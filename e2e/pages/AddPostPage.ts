import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { E2E_MOCKS_ENABLED, routeMock } from '../fixtures/mode';
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

import { type Page, type Locator, type Response as PlaywrightResponse, type Route as PlaywrightRoute, expect, test } from '@playwright/test';

import { text } from '../../features/posts/new/constants';

/** Valid 1x1 transparent PNG buffer with complete IDAT chunk so browser image decoder succeeds. */
export const VALID_PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** 1080×1080 PNG header only — passes the header dimension check, but a browser cannot decode it. */
const HEADER_ONLY_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x04, 0x38,
  0x00, 0x00, 0x04, 0x38,
  0x08, 0x06, 0x00, 0x00, 0x00,
  0x0e, 0x80, 0xbd, 0x50,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

/** Real PNG used when mocks are off. Set E2E_IMAGE to upload your own file instead. */
const REAL_PNG_PATH = process.env.E2E_IMAGE ?? join(__dirname, '../fixtures/images/transparent-1600x1200.png');

/**
 * Image the add-post specs upload. Mocked runs use the header-only PNG; real runs need an
 * image the browser can decode, because the real backend and upload flow process it.
 */
export const TINY_PNG = E2E_MOCKS_ENABLED ? HEADER_ONLY_PNG : readFileSync(REAL_PNG_PATH);

/** How long an upload may take to reach "uploaded". Parallel workers slow even mocked uploads down. */
const UPLOAD_TIMEOUT = E2E_MOCKS_ENABLED ? 25_000 : 90_000;

/** The tus upload endpoint (`/uploads` and `/uploads/<id>`), not the upload-session endpoints. */
function isTusUploadUrl(url: URL): boolean {
  return /\/uploads(\/|$)/.test(url.pathname);
}

function isPublishUrl(url: URL): boolean {
  return url.pathname.endsWith('/upload-sessions/publish');
}

/** Same shape as the backend's publish response (`ApiResponse<PublishPostResponse>`). */
const PUBLISH_SUCCESS = {
  status: 201,
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data: { postId: 'post_1' } }),
};

/** Simulated failures and delays only exist with mocks; a real backend cannot be told to fail. */
function skipWithoutMocks(reason: string) {
  test.skip(!E2E_MOCKS_ENABLED, `Mock-only: ${reason}`);
}

function isUploadSessionCreated(response: PlaywrightResponse): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/upload-sessions');
}

/**
 * Start of a HEIC file (an ISO `ftyp` box with the `heic` brand). The app checks file bytes,
 * not the MIME type, so this is what makes it reject the file as HEIC.
 */
const HEIC_HEADER = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from('ftypheic', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('mif1heic', 'ascii'),
]);

/** 11 MB zero-filled buffer — exceeds the 10 MB image size limit. */
export const OVERSIZED_PNG = Buffer.alloc(11 * 1024 * 1024);


export class AddPostPage {
  readonly page: Page;

  // ── Header & Footer ────────────────────────────────────────────────────────
  readonly headerTitle: Locator;
  readonly backButton:  Locator;
  readonly nextButton:  Locator;
  readonly addButton:   Locator;
  readonly shareButton: Locator;
  readonly previousButton: Locator;

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
    this.previousButton  = page.locator('#btn-back-to-select');
    this.fileInput      = page.locator('input[type="file"][multiple]');
    this.galleryContainer = page.locator('#selected-gallery-container');
    this.captionTextarea  = page.locator('#caption-textarea-input');
    this.confirmDeleteButton = page.locator('#btn-confirm-delete');
    this.rejectDeleteButton  = page.locator('#btn-reject-delete');
    this.sliderContainer     = page.locator('#post-slider-container');
  }

  // ── Route mocking ─────────────────────────────────────────────────────────

  uploadOffsets = new Map<string, number>();

  async mockUploadApi() {
    this.uploadOffsets.clear();

    const handleCorsOptions = (route: PlaywrightRoute) => {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:4000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'POST, GET, HEAD, PATCH, OPTIONS, DELETE',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable, Upload-Length',
        },
      });
    };

    await routeMock(this.page, 
      (url) => url.pathname.includes('upload'),
      async (route) => {
        const request = route.request();
        const urlStr = request.url();

        if (urlStr.includes('upload-session')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                uploadSessionId: 'mock-upload-session-123',
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
              },
            }),
          });
        }

        if (request.method() === 'OPTIONS') return handleCorsOptions(route);

        if (request.method() === 'POST') {
          const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          this.uploadOffsets.set(id, 0);
          return route.fulfill({
            status: 201,
            headers: {
              Location: `http://localhost:4000/uploads/${id}`,
              'Tus-Resumable': '1.0.0',
              'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable, Upload-Length',
              'Access-Control-Allow-Origin': 'http://localhost:4000',
              'Access-Control-Allow-Credentials': 'true',
            },
          });
        }

        const id = new URL(urlStr).pathname.split('/').pop()!;

        if (request.method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: VALID_PNG_1X1,
          });
        }


        if (request.method() === 'HEAD') {
          const offset = this.uploadOffsets.get(id) ?? 0;
          return route.fulfill({
            status: 200,
            headers: {
              'Upload-Offset': String(offset),
              'Tus-Resumable': '1.0.0',
              'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable, Upload-Length',
              'Access-Control-Allow-Origin': 'http://localhost:4000',
              'Access-Control-Allow-Credentials': 'true',
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
            headers: {
              'Upload-Offset': String(offset),
              'Tus-Resumable': '1.0.0',
              'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable, Upload-Length',
              'Access-Control-Allow-Origin': 'http://localhost:4000',
              'Access-Control-Allow-Credentials': 'true',
            },
          });
        }

        return route.continue();
      }
    );
  }



  /**
   * Override the upload mock to simulate a server error.
   * Because Playwright matches routes in LIFO order, calling this AFTER
   * mockUploadApi() will take priority for subsequent upload requests.
   */
  async mockUploadApiWithError() {
    skipWithoutMocks('needs a simulated upload error');
    await routeMock(this.page, isTusUploadUrl, (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
  }

  /**
   * Override the upload mock to delay each data chunk (PATCH) before it succeeds.
   * The cell only shows "uploading" with a percentage once tus reports progress on a PATCH,
   * so delaying the PATCH is what keeps an upload visibly in flight.
   */
  async mockSlowUploadApi(delayMs = 2_000) {
    skipWithoutMocks('needs a simulated slow upload');
    await routeMock(this.page, isTusUploadUrl, async (route) => {
      if (route.request().method() === 'PATCH') {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      return route.fallback();
    });
  }

  /**
   * Intercept upload creation and fail only for the given filenames
   * (matched via the tus `Upload-Metadata` header, which tus-js-client
   * encodes as base64 `key value,key value` pairs). Succeeds for everything
   * else. Used to verify one failed upload doesn't block or cancel the others.
   */
  async mockUploadApiFailingFor(filenames: string[]) {
    skipWithoutMocks('needs a simulated upload failure');
    await routeMock(this.page, isTusUploadUrl, (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      const metadataHeader = route.request().headers()['upload-metadata'] ?? '';
      const filename = metadataHeader
        .split(',')
        .map((pair) => pair.trim().split(' '))
        .find(([key]) => key === 'filename');
      const decoded = filename ? Buffer.from(filename[1], 'base64').toString('utf-8') : undefined;
      if (decoded && filenames.includes(decoded)) {
        return route.fulfill({ status: 500, body: 'Server Error' });
      }
      return route.fallback();
    });
  }

  /** Upload an oversized image (>10 MB) that the client validator rejects. */
  async uploadOversizedImage() {
    await this.uploadFiles([{ name: 'big.png', mimeType: 'image/png', buffer: OVERSIZED_PNG }]);
  }

  // ── Publish (POST /upload-sessions/publish) mocking ───────────────────────

  /** Number of publish requests observed since the last mock* call. Used to assert no duplicate submissions fire. */
  publishRequestCount = 0;

  /** Intercept the publish request and return an instant success response. */
  async mockPublishApi() {
    this.publishRequestCount = 0;
    await routeMock(this.page, isPublishUrl, (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      this.publishRequestCount += 1;
      return route.fulfill(PUBLISH_SUCCESS);
    });
  }

  /** Override the publish mock to simulate a server error. LIFO routing makes this win over mockPublishApi(). */
  async mockPublishApiWithError() {
    skipWithoutMocks('needs a simulated publish error');
    this.publishRequestCount = 0;
    await routeMock(this.page, isPublishUrl, (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      this.publishRequestCount += 1;
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
  }

  /** Override the publish mock to introduce a configurable delay before success — for asserting the loading state and duplicate-submission guard. */
  async mockSlowPublishApi(delayMs = 2_000) {
    skipWithoutMocks('needs a simulated slow publish');
    this.publishRequestCount = 0;
    await routeMock(this.page, isPublishUrl, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      this.publishRequestCount += 1;
      await new Promise((r) => setTimeout(r, delayMs));
      await route.fulfill(PUBLISH_SUCCESS);
    });
  }

  /** Resolves when the post's publish request gets its response. */
  waitForPublishResponse() {
    return this.page.waitForResponse((response) => isPublishUrl(new URL(response.url())));
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /** Navigate to /app/posts/new and wait until footer buttons are interactive. */
  async goto() {
    await this.page.addInitScript(() => {
      try {
        localStorage.setItem('inshop:add-post-onboarding-seen', '1');
      } catch {}
    });
    // The page drops picked files until its upload session exists, and a real backend
    // takes a few seconds to create it. Mocked or real, wait for it before using the page.
    const uploadSessionCreated = this.page.waitForResponse(isUploadSessionCreated, { timeout: 30_000 });
    await this.page.goto('/app/posts/new');
    await uploadSessionCreated;
    await this.dismissOnboardingIfPresent();
    await expect(this.addButton).toBeEnabled({ timeout: 10_000 });
  }

  /** Reload the page, like a seller reopening the tab, and wait until it can take files again. */
  async reload() {
    const uploadSessionCreated = this.page.waitForResponse(isUploadSessionCreated, { timeout: 30_000 });
    await this.page.reload();
    await uploadSessionCreated;
    await this.dismissOnboardingIfPresent();
  }

  async dismissOnboardingIfPresent() {
    const gotItBtn = this.page.locator('#add-post-onboarding-got-it');
    if (await gotItBtn.isVisible().catch(() => false)) {
      await gotItBtn.click();
    }
  }

  // ── File input ────────────────────────────────────────────────────────────

  /** Provide files to the hidden file input. */
  async uploadFiles(
    files: Array<{ name: string; mimeType: string; buffer: Buffer }>,
  ) {
    await expect(this.addButton).toBeEnabled({ timeout: 15_000 });
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
    await this.uploadFiles([{ name, mimeType: 'image/heic', buffer: HEIC_HEADER }]);
  }

  // ── Waits ─────────────────────────────────────────────────────────────────

  /**
   * Wait until at least one gallery item reaches "uploaded" status.
   *
   * GalleryCell.tsx exposes `data-status` on its root element — this reads
   * real component state directly instead of matching translated UI text
   * (which doesn't carry a per-item "uploaded" indicator string at all).
   */
  async waitForGalleryHasUploadedItem(timeout = UPLOAD_TIMEOUT) {
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
  async waitForUploadedCount(n: number, timeout = UPLOAD_TIMEOUT) {
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

  /** Tap the trash button on the preview slider, which opens the DeleteImageDialog for the image on show. */
  async openDeleteDialogForPreviewedImage() {
    await this.page.locator('[id^="btn-delete-media-"]').click();
  }

  /** Confirm removal in the DeleteImageDialog opened by openDeleteDialogForPreviewedImage(). */
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
  /** The details footer's "previous" button returns to the select phase. The header Back leaves the page. */
  async clickPrevious() { await this.previousButton.click(); }

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
    // Valid uploads are selected automatically; tapping the cell would deselect it.
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
