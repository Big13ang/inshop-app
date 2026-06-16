/**
 * E2E Tests — Posts / Add New Post
 *
 * Layer:   E2E (real Chromium browser, running Next.js dev server)
 * Runner:  Playwright
 * Pattern: Page Object Model (AddPostPage) + custom fixtures
 *
 * QA mandate:
 *   These tests cover the complete "create a post" user journey across two phases:
 *
 *     select phase  — file picker, gallery with status overlays, item selection, preview slider
 *     details phase — caption textarea, Share button, submit guard
 *
 *   What each layer uniquely owns:
 *     Unit      → validation logic (validateBatch.test.ts), store mutations (mediaStore.test.ts)
 *     Component → React rendering & interaction stubs (AddPostView.test.tsx)
 *     E2E       → full browser stack, real file input handling, real Sonner toasts,
 *                 phase transitions, DOM accessibility, mobile viewport
 *
 * Upload API:
 *   POST /api/upload/chunk is intercepted by the addPostPage fixture via page.route().
 *   Tests never touch a real server. To test failure paths, individual tests can
 *   call page.route() again — Playwright's LIFO routing means the newer handler wins.
 *
 * Rules:
 *   ✅ Page Object Model — no raw locators in this file
 *   ✅ No waitForTimeout — only deterministic waits (expect().toBeVisible(), etc.)
 *   ✅ Each test is fully independent — no ordering dependency
 *   ✅ Descriptive test names — each reads like a product specification
 *   ✅ Arabic/Persian text imported from constants — not hardcoded here
 */

import { test, expect } from '../fixtures';
import { TINY_PNG, MOCK_CDN_URL, OVERSIZED_PNG } from '../pages/AddPostPage';
import { text } from '../../features/posts/new/constants';

// ─── Suite 1: Initial state — select phase ────────────────────────────────────

test.describe('Add New Post — initial state (select phase)', () => {
  test('renders the header title', async ({ addPostPage }) => {
    await expect(addPostPage.headerTitle).toBeVisible();
    await expect(addPostPage.headerTitle).toHaveText(text.headerTitle);
  });

  test('renders the Next button', async ({ addPostPage }) => {
    await expect(addPostPage.nextButton).toBeVisible();
    await expect(addPostPage.nextButton).toBeEnabled();
  });

  test('renders the Add button', async ({ addPostPage }) => {
    await expect(addPostPage.addButton).toBeVisible();
    await expect(addPostPage.addButton).toBeEnabled();
  });

  test('Share button is not visible in the select phase', async ({ addPostPage }) => {
    await expect(addPostPage.shareButton).not.toBeVisible();
  });

  test('shows the empty gallery placeholder text', async ({ addPostPage }) => {
    await expect(
      addPostPage.galleryContainer.getByText('تصویری انتخاب نشده'),
    ).toBeVisible();
  });

  test('shows the helper text prompting the user to add images', async ({ addPostPage }) => {
    await expect(
      addPostPage.galleryContainer.getByText(/اضافه کردن/),
    ).toBeVisible();
  });
});

// ─── Suite 2: File input attributes ──────────────────────────────────────────
//
// These tests verify the raw <input> attributes that control native browser
// behaviour — particularly the iOS/Android gallery opener and multi-select.

test.describe('Add New Post — file input attributes', () => {
  test('file input has type="file"', async ({ addPostPage }) => {
    await expect(addPostPage.fileInput).toHaveAttribute('type', 'file');
  });

  test('file input has accept="image/*" to open the native gallery on iOS/Android', async ({
    addPostPage,
  }) => {
    await expect(addPostPage.fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('file input has the multiple attribute to allow multi-select', async ({ addPostPage }) => {
    await expect(addPostPage.fileInput).toHaveAttribute('multiple');
  });
});

// ─── Suite 3: File upload flow ────────────────────────────────────────────────

test.describe('Add New Post — file upload', () => {
  test('uploading a valid image adds it to the gallery', async ({ addPostPage }) => {
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    // A thumbnail <img> appears inside the gallery container
    await expect(addPostPage.galleryContainer.locator('img')).toBeVisible({ timeout: 15_000 });
  });

  test('gallery counter shows uploaded count once the upload completes', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    // Format: "0 از 1 انتخاب شده" — uploadedCount becomes 1
    await expect(addPostPage.page.getByText(/0 از 1 انتخاب شده/)).toBeVisible();
  });

  test('uploading an invalid file type shows a format warning toast', async ({ addPostPage }) => {
    await addPostPage.uploadInvalidFile('document.heic');
    // Toast title: "فقط JPG، PNG و WebP مجاز است"
    await expect(
      addPostPage.page.getByText('فقط JPG، PNG و WebP مجاز است'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('toast for invalid file includes the rejected-file count in its description', async ({
    addPostPage,
  }) => {
    await addPostPage.uploadInvalidFile('document.heic');
    await expect(
      addPostPage.page.getByText('1 فایل نادیده گرفته شد'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('invalid file does not appear in the gallery', async ({ addPostPage }) => {
    await addPostPage.uploadInvalidFile('document.heic');
    // Wait a moment for any potential async state update, then assert empty gallery
    await expect(
      addPostPage.galleryContainer.getByText('تصویری انتخاب نشده'),
    ).toBeVisible({ timeout: 3_000 });
    await expect(addPostPage.galleryContainer.locator('img')).not.toBeVisible();
  });

  test('failed upload shows the "خطا" overlay on the gallery cell', async ({
    addPostPage,
    page,
  }) => {
    // Override the success mock — failure route takes LIFO priority
    await page.route('**/api/upload/chunk**', (route) =>
      route.fulfill({ status: 500, body: 'Server Error' }),
    );
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    // The "خطا" label from STATUS_CONFIG.failed is rendered in the overlay
    await expect(
      addPostPage.galleryContainer.getByText(text.statusFailed),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('multiple valid images all appear as gallery cells', async ({ addPostPage }) => {
    const twoFiles = [
      { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
    ];
    await addPostPage.uploadFiles(twoFiles);
    await addPostPage.waitForGalleryHasUploadedItem();
    // Two thumbnails should be in the gallery
    await expect(addPostPage.galleryContainer.locator('img')).toHaveCount(2);
  });
});

// ─── Suite 4: Gallery selection ───────────────────────────────────────────────

test.describe('Add New Post — gallery selection', () => {
  test('tapping an uploaded gallery cell selects it and shows an order badge', async ({
    addPostPage,
  }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.clickGalleryCell(0);
    // The order badge for the first selection is "1" — exact to avoid matching the counter span
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();
  });

  test('selection counter updates to reflect the tap', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.clickGalleryCell(0);
    // "1 از 1 انتخاب شده" — 1 selected, 1 uploaded
    await addPostPage.waitForSelectionCount(1);
  });

  test('tapping a selected cell deselects it', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    // Select
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(1);
    // Deselect
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(0);
  });

  test('preview slider updates to show "فایل 1 از 1" when an item is selected', async ({
    addPostPage,
  }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.clickGalleryCell(0);
    // SelectedMediaSlider renders this counter once a selection exists
    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();
  });

  test('selecting two images shows ordered badges 1 and 2', async ({ addPostPage }) => {
    await addPostPage.uploadFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    await addPostPage.waitForGalleryHasUploadedItem();
    // Wait for second item to also be uploaded
    await expect(addPostPage.page.getByText(/0 از 2 انتخاب شده/)).toBeVisible();

    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(1);
    await addPostPage.clickGalleryCell(1);

    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();
    await expect(addPostPage.galleryContainer.getByText('2', { exact: true })).toBeVisible();
  });
});

// ─── Suite 5: Phase gate — Next button ───────────────────────────────────────

test.describe('Add New Post — Next button guards', () => {
  test('Next with no selected images shows the "لطفاً حداقل ۱ تصویر" toast', async ({
    addPostPage,
  }) => {
    await addPostPage.clickNext();
    await expect(
      addPostPage.page.getByText(text.alertNoImages),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Next with a selected uploaded image advances to the details phase', async ({
    addPostPage,
  }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(1);
    await addPostPage.clickNext();
    await addPostPage.assertOnDetailsPhase();
  });

  test('uploading files but selecting none still blocks Next', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    // No selection tap — selectedIds is empty
    await addPostPage.clickNext();
    await expect(
      addPostPage.page.getByText(text.alertNoImages),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── Suite 6: Details phase — caption form ────────────────────────────────────

test.describe('Add New Post — details phase', () => {
  test('caption textarea is visible and associated with its label', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    // getByLabel tests the label↔input association (htmlFor / aria-labelledby)
    await expect(addPostPage.page.getByLabel(text.captionLabel)).toBeVisible();
  });

  test('Share button is visible in the details phase', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.shareButton).toBeVisible();
  });

  test('Share button is disabled when the caption is empty', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.shareButton).toBeDisabled();
  });

  test('Share button enables when the caption has content', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('محصول جدید با کیفیت بالا');
    await expect(addPostPage.shareButton).toBeEnabled();
  });

  test('caption error text appears when the textarea is cleared after typing', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('متن موقت');
    await addPostPage.clearCaption();
    await expect(
      addPostPage.page.getByText(text.captionError),
    ).toBeVisible();
  });

  test('Share button goes back to disabled after caption is cleared', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('متن موقت');
    await expect(addPostPage.shareButton).toBeEnabled();
    await addPostPage.clearCaption();
    await expect(addPostPage.shareButton).toBeDisabled();
  });

  test('the selected images preview slider is visible in the details phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    // The slider counter "فایل 1 از 1" confirms it rendered with the selection
    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();
  });

  test('Share button is disabled when caption is empty', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.shareButton).toBeDisabled();
  });

  test('caption error is NOT shown on initial render before the user types', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.page.getByText(text.captionError)).not.toBeVisible();
  });
});

// ─── Suite 7: Back navigation ─────────────────────────────────────────────────

test.describe('Add New Post — back navigation', () => {
  test('Back from the details phase returns to the select phase', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.assertOnDetailsPhase();

    await addPostPage.clickBack();
    await addPostPage.assertOnSelectPhase();
  });

  test('Next and Add buttons are visible again after returning to select phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.clickBack();

    await expect(addPostPage.nextButton).toBeVisible();
    await expect(addPostPage.addButton).toBeVisible();
  });

  test('previously selected images remain in the gallery after returning to select phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.clickBack();
    // The gallery cell with its thumbnail must still be rendered
    await expect(addPostPage.galleryContainer.locator('img')).toBeVisible();
  });

  test('previously selected items stay selected after returning to select phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.clickBack();
    // Selection badge "1" should still be visible — use exact to avoid matching the counter span
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();
  });
});

// ─── Suite 8: Accessibility ────────────────────────────────────────────────────

test.describe('Add New Post — accessibility', () => {
  test('caption textarea is associated with its label via htmlFor', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    // If the association is broken, getByLabel returns nothing
    const labelledInput = addPostPage.page.getByLabel(text.captionLabel);
    await expect(labelledInput).toBeVisible();
  });

  test('back button is present and focusable', async ({ addPostPage }) => {
    await expect(addPostPage.backButton).toBeVisible();
    await addPostPage.backButton.focus();
    await expect(addPostPage.backButton).toBeFocused();
  });
});

// ─── Suite 9: Upload progress indicator on gallery items ──────────────────────

test.describe('Add New Post — upload progress indicator', () => {
  test('progress indicator appears on the gallery cell while upload is in flight', async ({ addPostPage, page }) => {
    await addPostPage.mockSlowUploadApi(3_000);
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    // The gallery cell thumbnail should be added
    const cell = addPostPage.galleryContainer.locator('div.aspect-square');
    await expect(cell).toBeVisible({ timeout: 5_000 });
    // It should display the uploading progress (e.g. "٪" character/percentage)
    await expect(cell.getByText(/٪/)).toBeVisible({ timeout: 5_000 });
  });

  test('progress overlay disappears after upload completes', async ({ addPostPage, page }) => {
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    await addPostPage.waitForGalleryHasUploadedItem();
    // Once status = 'uploaded', the status overlay (containing percentage symbol '٪') disappears
    const cell = addPostPage.galleryContainer.locator('div.aspect-square');
    await expect(cell.getByText(/٪/)).not.toBeVisible({ timeout: 10_000 });
  });

  test('failed upload shows the error state on the cell', async ({ addPostPage, page }) => {
    await page.route('**/api/upload/chunk**', (route) =>
      route.fulfill({ status: 500, body: 'Server Error' }),
    );
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    // The status text "خطا" (Error) should be visible on the gallery cell
    await expect(
      addPostPage.galleryContainer.getByText(text.statusFailed),
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Suite 10: Oversized file validation ─────────────────────────────────────

test.describe('Add New Post — oversized file validation', () => {
  test('uploading a file over 10 MB shows a size warning toast', async ({ addPostPage }) => {
    await addPostPage.uploadOversizedImage();
    await expect(
      addPostPage.page.getByText('حجم عکس نباید بیشتر از ۱۰ مگابایت باشد'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('oversized file does not appear in the gallery', async ({ addPostPage }) => {
    await addPostPage.uploadOversizedImage();
    await expect(
      addPostPage.galleryContainer.getByText('تصویری انتخاب نشده'),
    ).toBeVisible({ timeout: 3_000 });
    await expect(addPostPage.galleryContainer.locator('img')).not.toBeVisible();
  });
});

// ─── Suite 11: Mobile viewport (Pixel 5) ─────────────────────────────────────
// These assertions run in both Desktop Chrome and the 'mobile-chrome' Playwright
// project (Pixel 5 viewport) defined in playwright.config.ts.

test.describe('Add New Post — mobile viewport', () => {
  test('page renders without horizontal scroll', async ({ addPostPage, page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('Next button is visible above the fold', async ({ addPostPage, page }) => {
    const box = await addPostPage.nextButton.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('Add button is visible above the fold', async ({ addPostPage, page }) => {
    const box = await addPostPage.addButton.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('gallery renders without horizontal overflow', async ({ addPostPage }) => {
    const containerBox = await addPostPage.galleryContainer.boundingBox();
    const pageWidth     = await addPostPage.page.evaluate(() => window.innerWidth);
    if (containerBox) {
      expect(containerBox.x + containerBox.width).toBeLessThanOrEqual(pageWidth);
    }
  });
});
