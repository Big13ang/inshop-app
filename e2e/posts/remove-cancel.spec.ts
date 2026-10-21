/**
 * E2E — Add New Post: remove / cancel an upload
 *
 * Covers DeleteImageDialog (preview trash button → confirm/cancel) and the
 * resulting effect on the gallery and the selected-media slider.
 *
 * The trash button only shows while the post has more than one image,
 * so every test starts with two.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG, type AddPostPage } from '../pages/AddPostPage';

const TWO_IMAGES = [
  { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
  { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
];

async function uploadTwoImages(addPostPage: AddPostPage) {
  await addPostPage.uploadFiles(TWO_IMAGES);
  await addPostPage.waitForUploadedCount(2);
}

function galleryCells(addPostPage: AddPostPage) {
  return addPostPage.galleryContainer.locator('[data-status]');
}

test.describe('Add New Post — remove upload', () => {
  test('the preview delete button opens the delete confirmation dialog', async ({ addPostPage }) => {
    await uploadTwoImages(addPostPage);
    await addPostPage.openDeleteDialogForPreviewedImage();
    await expect(addPostPage.confirmDeleteButton).toBeVisible();
    await expect(addPostPage.rejectDeleteButton).toBeVisible();
  });

  test('confirming delete removes the image from the gallery', async ({ addPostPage }) => {
    await uploadTwoImages(addPostPage);
    await addPostPage.openDeleteDialogForPreviewedImage();
    await addPostPage.confirmDelete();

    await expect(galleryCells(addPostPage)).toHaveCount(1);
  });

  test('dismissing the dialog keeps the image in the gallery', async ({ addPostPage }) => {
    await uploadTwoImages(addPostPage);
    await addPostPage.openDeleteDialogForPreviewedImage();
    await addPostPage.dismissDelete();

    await expect(addPostPage.confirmDeleteButton).not.toBeVisible();
    await expect(galleryCells(addPostPage)).toHaveCount(2);
  });

  test('removing a selected image also clears it from the preview slider', async ({ addPostPage }) => {
    await uploadTwoImages(addPostPage);
    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();

    await addPostPage.openDeleteDialogForPreviewedImage();
    await addPostPage.confirmDelete();

    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();
  });

  test('removing one of two uploaded images leaves the other selectable', async ({ addPostPage }) => {
    await uploadTwoImages(addPostPage);

    await addPostPage.openDeleteDialogForPreviewedImage();
    await addPostPage.confirmDelete();
    await addPostPage.waitForUploadedCount(1);

    // Toggle it off and on again to show it is still selectable
    await addPostPage.waitForSelectionCount(1);
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(0);
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(1);
  });
});

test.describe('Add New Post — cancel an in-flight upload', () => {
  test('removing an upload while it is still in progress stops it and clears the cell', async ({
    addPostPage,
  }) => {
    await addPostPage.mockSlowUploadApi(10_000);
    await addPostPage.uploadFiles(TWO_IMAGES);
    const cell = addPostPage.galleryContainer.locator('div.aspect-square').first();
    await expect(cell.getByText(/٪/)).toBeVisible({ timeout: 5_000 });

    await addPostPage.openDeleteDialogForPreviewedImage();
    await addPostPage.confirmDelete();

    await expect(galleryCells(addPostPage)).toHaveCount(1);
  });
});
