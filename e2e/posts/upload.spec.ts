/**
 * E2E — Add New Post: file upload, validation and progress
 *
 * Covers the upload pipeline itself: valid/invalid/oversized files, the
 * per-cell progress indicator, and failure surfaces. Gallery *selection*
 * behaviour lives in gallery-selection.spec.ts.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG } from '../pages/AddPostPage';
import { text, MAX_IMAGES } from '../../features/posts/new/constants';

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
    // SelectedGallery renders "{count}/{MAX_IMAGES} تصویر" once an item is added
    await expect(addPostPage.page.getByText(`1/${MAX_IMAGES} تصویر`)).toBeVisible();
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
  }) => {
    // Override the success mock — failure route takes LIFO priority
    await addPostPage.mockUploadApiWithError();
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

  test('failed upload shows the error state on the cell', async ({ addPostPage }) => {
    await addPostPage.mockUploadApiWithError();
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    // The status text "خطا" (Error) should be visible on the gallery cell
    await expect(
      addPostPage.galleryContainer.getByText(text.statusFailed),
    ).toBeVisible({ timeout: 15_000 });
  });
});

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
