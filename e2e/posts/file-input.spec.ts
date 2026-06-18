/**
 * E2E — Add New Post: file input attributes
 *
 * Verifies the raw <input> attributes that control native browser behaviour —
 * particularly the iOS/Android gallery opener and multi-select.
 */

import { test, expect } from '../fixtures';

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
