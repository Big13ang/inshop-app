/**
 * E2E — Add New Post: gallery selection
 *
 * Covers selecting/deselecting uploaded gallery cells and the resulting
 * order badges, selection counter, and preview slider sync.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG } from '../pages/AddPostPage';

test.describe('Add New Post — gallery selection', () => {
  test('tapping an uploaded gallery cell toggles its selection state', async ({
    addPostPage,
  }) => {
    await addPostPage.uploadValidImage();
    // Newly uploaded images are automatically selected with order badge 1
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();

    // Tapping deselects it
    await addPostPage.clickGalleryCell(0);
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).not.toBeVisible();

    // Tapping again re-selects it
    await addPostPage.clickGalleryCell(0);
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();
  });

  test('selection counter updates to reflect the tap', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    // Auto-selected on upload: 1 selected
    await addPostPage.waitForSelectionCount(1);
    // Tap to deselect: 0 selected
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(0);
  });

  test('tapping a selected cell deselects it', async ({ addPostPage }) => {
    await addPostPage.uploadValidImage();
    // Auto-selected on upload
    await addPostPage.waitForSelectionCount(1);
    // Deselect
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(0);
  });

  test('preview slider updates to show "فایل 1 از 1" when an item is selected', async ({
    addPostPage,
  }) => {
    await addPostPage.uploadValidImage();
    // SelectedMediaSlider renders this counter once a selection exists
    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();
  });

  test('selecting two images shows ordered badges 1 and 2', async ({ addPostPage }) => {
    await addPostPage.uploadFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    await addPostPage.waitForGalleryHasUploadedItem();
    await addPostPage.waitForUploadedCount(2);

    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();
    await expect(addPostPage.galleryContainer.getByText('2', { exact: true })).toBeVisible();
  });


  test('clicking a cell that is still uploading does not select it', async ({ addPostPage }) => {
    await addPostPage.mockSlowUploadApi(5_000);
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    const cell = addPostPage.galleryContainer.locator('div.aspect-square').first();
    await expect(cell).toBeVisible({ timeout: 5_000 });
    await expect(cell.getByText(/٪/)).toBeVisible({ timeout: 5_000 });

    await addPostPage.clickGalleryCell(0);

    // No order badge should appear — selection is rejected while status !== 'uploaded'
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).not.toBeVisible();
  });

  test('clicking a failed cell retries the upload instead of selecting it', async ({
    addPostPage,
  }) => {
    await addPostPage.mockUploadApiWithError();
    await addPostPage.uploadFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);
    await expect(addPostPage.galleryContainer.getByText('خطا')).toBeVisible({ timeout: 15_000 });

    await addPostPage.clickGalleryCell(0);

    // Clicking a failed cell triggers onRetry, not onToggle — no selection badge appears
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).not.toBeVisible();
  });
});
