/**
 * E2E — Add New Post: remove / cancel an upload
 *
 * Covers DeleteImageDialog (long-press a cell → confirm/cancel) and the
 * resulting effect on the gallery and the selected-media slider.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG } from '../pages/AddPostPage';

test.describe('Add New Post — remove upload', () => {
  test('long-pressing a gallery cell opens the delete confirmation dialog', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.longPressGalleryCell(0);
    await expect(addPostPage.confirmDeleteButton).toBeVisible();
    await expect(addPostPage.rejectDeleteButton).toBeVisible();
  });

  test('confirming delete removes the image from the gallery', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.longPressGalleryCell(0);
    await addPostPage.confirmDelete();

    await expect(
      addPostPage.galleryContainer.getByText('تصویری انتخاب نشده'),
    ).toBeVisible();
    await expect(addPostPage.galleryContainer.locator('img')).not.toBeVisible();
  });

  test('dismissing the dialog keeps the image in the gallery', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.longPressGalleryCell(0);
    await addPostPage.dismissDelete();

    await expect(addPostPage.confirmDeleteButton).not.toBeVisible();
    await expect(addPostPage.galleryContainer.locator('img')).toBeVisible();
  });

  test('removing a selected image also clears it from the preview slider', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(1);
    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();

    await addPostPage.longPressGalleryCell(0);
    await addPostPage.confirmDelete();

    await expect(addPostPage.page.getByText('فایل 1 از 1')).not.toBeVisible();
  });

  test('removing one of two uploaded images leaves the other selectable', async ({ addPostPage }) => {
    await addPostPage.uploadFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    await addPostPage.waitForUploadedCount(2);

    await addPostPage.longPressGalleryCell(0);
    await addPostPage.confirmDelete();

    await addPostPage.waitForUploadedCount(1);
    await expect(addPostPage.galleryContainer.locator('img')).toHaveCount(1);

    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(1);
  });
});

test.describe('Add New Post — cancel an in-flight upload', () => {
  test('removing an upload while it is still in progress stops it and clears the cell', async ({
    addPostPage,
  }) => {
    await addPostPage.mockSlowUploadApi(10_000);
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    const cell = addPostPage.galleryContainer.locator('div.aspect-square').first();
    await expect(cell.getByText(/٪/)).toBeVisible({ timeout: 5_000 });

    await addPostPage.longPressGalleryCell(0);
    await addPostPage.confirmDelete();

    await expect(
      addPostPage.galleryContainer.getByText('تصویری انتخاب نشده'),
    ).toBeVisible();
  });
});
