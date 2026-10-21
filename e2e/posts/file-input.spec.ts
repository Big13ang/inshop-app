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

  test('touch devices get accept="image/*" to open the native gallery; desktop lists the supported formats', async ({
    addPostPage,
    hasTouch,
  }) => {
    const expected = hasTouch ? 'image/*' : 'image/jpeg,image/png,image/webp';
    await expect(addPostPage.fileInput).toHaveAttribute('accept', expected);
  });

  test('file input has the multiple attribute to allow multi-select', async ({ addPostPage }) => {
    await expect(addPostPage.fileInput).toHaveAttribute('multiple');
  });
});
