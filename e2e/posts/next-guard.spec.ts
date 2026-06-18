/**
 * E2E — Add New Post: Next button phase gate
 *
 * Verifies the select → details transition is blocked until at least one
 * uploaded image is selected.
 */

import { test, expect } from '../fixtures';
import { text } from '../../features/posts/new/constants';

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
