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

/** CDN URL returned by the mocked chunk upload endpoint. */
export const MOCK_CDN_URL = 'https://cdn.test/photo.png';

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
  }

  // ── Route mocking ─────────────────────────────────────────────────────────

  /**
   * Intercept POST /api/upload/chunk and return an instant success response.
   * Must be called BEFORE goto() so the mock is active before the page loads.
   */
  async mockUploadApi() {
    await this.page.route('**/api/upload/chunk**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: MOCK_CDN_URL }),
      }),
    );
  }

  /**
   * Override the upload mock to simulate a server error.
   * Because Playwright matches routes in LIFO order, calling this AFTER
   * mockUploadApi() will take priority for subsequent upload requests.
   */
  async mockUploadApiWithError() {
    await this.page.route('**/api/upload/chunk**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );
  }

  /**
   * Override the upload mock to introduce a configurable delay before success.
   * Useful for verifying the progress loader appears during an in-flight upload.
   */
  async mockSlowUploadApi(delayMs = 2_000) {
    await this.page.route('**/api/upload/chunk**', async (route) => {
      await new Promise((r) => setTimeout(r, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: MOCK_CDN_URL }),
      });
    });
  }

  /** Upload an oversized image (>10 MB) that the client validator rejects. */
  async uploadOversizedImage() {
    await this.uploadFiles([{ name: 'big.png', mimeType: 'image/png', buffer: OVERSIZED_PNG }]);
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
   * The gallery counter renders "{selectedIds.length} از {uploadedCount} انتخاب شده".
   * The regex matches when uploadedCount ≥ 1 (e.g. "0 از 1 انتخاب شده").
   */
  async waitForGalleryHasUploadedItem(timeout = 15_000) {
    await expect(
      this.page.getByText(/از [1-9]\d* انتخاب شده/),
    ).toBeVisible({ timeout });
  }

  /**
   * Wait until the gallery selection counter shows `n` selected items.
   * E.g., waitForSelectionCount(1) waits for "1 از … انتخاب شده".
   */
  async waitForSelectionCount(n: number) {
    await expect(
      this.page.getByText(new RegExp(`^${n} از \\d+ انتخاب شده$`)),
    ).toBeVisible();
  }

  // ── Gallery interactions ──────────────────────────────────────────────────

  /**
   * Click the Nth gallery cell image (0-indexed, left→right, top→bottom).
   * Only real cells contain <img> elements; empty-state placeholders do not.
   * The click bubbles from the img to the cell's onClick handler.
   */
  async clickGalleryCell(index: number) {
    // React 18 delegates events via bubbling from the root. dispatchEvent('click') creates a
    // non-bubbling generic Event that React never sees, so we dispatch a proper MouseEvent.
    await this.galleryContainer.locator('div.cursor-pointer').nth(index).evaluate(
      (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    );
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
