/**
 * E2E — Add New Post: upload resilience
 *
 * Verifies that concurrent uploads are independent of each other: one
 * file failing must not stop, cancel, or delay the others.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG } from '../pages/AddPostPage';
import { text } from '../../features/posts/new/constants';

test.describe('Add New Post — one failed upload does not affect the others', () => {
  test('uploading a failing file alongside a valid one: the valid one still completes and stays selectable', async ({
    addPostPage,
  }) => {
    await addPostPage.mockUploadApiFailingFor(['fail.png']);

    await addPostPage.uploadFiles([
      { name: 'fail.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'ok.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);

    // The failing file ends up in the "failed" state (after its internal retries)...
    await expect(
      addPostPage.galleryContainer.getByText(text.statusFailed),
    ).toBeVisible({ timeout: 20_000 });

    // ...while the other file completes normally and can be selected.
    await addPostPage.waitForUploadedCount(1);
    await addPostPage.clickGalleryCell(1);
    await addPostPage.waitForSelectionCount(1);
  });
});
