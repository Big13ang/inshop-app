/**
 * E2E — Add New Post: concurrent upload queue
 *
 * useMediaUpload.ts caps concurrent uploads at 3 via p-limit(3). Adding a
 * 4th file must leave it queued until one of the first three finishes.
 */

import { test, expect } from '../fixtures';
import { TINY_PNG } from '../pages/AddPostPage';

test.describe('Add New Post — concurrent upload queue (max 3)', () => {
  test('a 4th file stays queued while 3 others are uploading, then starts once a slot frees', async ({
    addPostPage,
  }) => {
    await addPostPage.mockSlowUploadApi(4_000);

    await addPostPage.uploadFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'c.png', mimeType: 'image/png', buffer: TINY_PNG },
      { name: 'd.png', mimeType: 'image/png', buffer: TINY_PNG },
    ]);

    // While all 3 slots are busy, the 4th file must still be 'queued' — never 'uploading'.
    await expect(
      addPostPage.galleryContainer.locator('[data-status="uploading"]'),
    ).toHaveCount(3, { timeout: 5_000 });
    await expect(
      addPostPage.galleryContainer.locator('[data-status="queued"]'),
    ).toHaveCount(1);

    // Once the first 3 finish, the 4th must pick up the freed slot and complete too.
    await addPostPage.waitForUploadedCount(4, 10_000);
  });
});
