/**
 * E2E — Add New Post: details phase (caption form)
 *
 * Covers the caption textarea, validation, and Share button enable/disable
 * logic. Submission itself is covered in publish.spec.ts.
 */

import { test, expect } from '../fixtures';
import { text } from '../../features/posts/new/constants';

test.describe('Add New Post — details phase', () => {
  test('caption textarea is visible and associated with its label', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    // getByLabel tests the label↔input association (htmlFor / aria-labelledby)
    await expect(addPostPage.page.getByLabel(text.captionLabel)).toBeVisible();
  });

  test('Share button is visible in the details phase', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.shareButton).toBeVisible();
  });

  test('Share button is disabled when the caption is empty', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.shareButton).toBeDisabled();
  });

  test('Share button enables when the caption has content', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('محصول جدید با کیفیت بالا');
    await expect(addPostPage.shareButton).toBeEnabled();
  });

  test('caption error text appears when the textarea is cleared after typing', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('متن موقت');
    await addPostPage.clearCaption();
    await expect(
      addPostPage.page.getByText(text.captionError),
    ).toBeVisible();
  });

  test('Share button goes back to disabled after caption is cleared', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('متن موقت');
    await expect(addPostPage.shareButton).toBeEnabled();
    await addPostPage.clearCaption();
    await expect(addPostPage.shareButton).toBeDisabled();
  });

  test('the selected images preview slider is visible in the details phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    // The slider counter "فایل 1 از 1" confirms it rendered with the selection
    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();
  });

  test('caption error is NOT shown on initial render before the user types', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await expect(addPostPage.page.getByText(text.captionError)).not.toBeVisible();
  });
});
