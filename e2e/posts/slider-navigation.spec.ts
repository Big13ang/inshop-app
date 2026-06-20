/**
 * E2E — Add New Post: preview slider navigation
 *
 * Covers the "slider supports navigation and touch interaction" acceptance
 * criterion via keen-slider's keyboard (ArrowLeft/ArrowRight) and pointer
 * drag (swipe) handlers in components/ui/PostSlider.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG } from '../pages/AddPostPage';

async function selectTwoImages(addPostPage: import('../pages/AddPostPage').AddPostPage) {
  await addPostPage.uploadFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ]);
  await addPostPage.waitForGalleryHasUploadedItem();
  await addPostPage.waitForUploadedCount(2);
  await addPostPage.clickGalleryCell(0);
  await addPostPage.waitForSelectionCount(1);
  await addPostPage.clickGalleryCell(1);
  await addPostPage.waitForSelectionCount(2);
}

test.describe('Add New Post — slider keyboard navigation', () => {
  test('ArrowRight advances to the next slide and ArrowLeft goes back', async ({ addPostPage }) => {
    await selectTwoImages(addPostPage);

    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();

    await addPostPage.pressSliderArrow('ArrowRight');
    await expect(addPostPage.page.getByText('فایل 2 از 2')).toBeVisible();

    await addPostPage.pressSliderArrow('ArrowLeft');
    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();
  });

  test('ArrowLeft does nothing on the first slide and ArrowRight does nothing on the last', async ({
    addPostPage,
  }) => {
    await selectTwoImages(addPostPage);

    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();
    await addPostPage.pressSliderArrow('ArrowLeft');
    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();

    await addPostPage.pressSliderArrow('ArrowRight');
    await expect(addPostPage.page.getByText('فایل 2 از 2')).toBeVisible();
    await addPostPage.pressSliderArrow('ArrowRight');
    await expect(addPostPage.page.getByText('فایل 2 از 2')).toBeVisible();
  });
});

test.describe('Add New Post — slider swipe/touch navigation', () => {
  test('dragging the slider changes the active slide', async ({ addPostPage }) => {
    await selectTwoImages(addPostPage);

    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();

    await addPostPage.swipeSlider('left');
    await expect(addPostPage.page.getByText('فایل 2 از 2')).toBeVisible();

    await addPostPage.swipeSlider('right');
    await expect(addPostPage.page.getByText('فایل 1 از 2')).toBeVisible();
  });
});
