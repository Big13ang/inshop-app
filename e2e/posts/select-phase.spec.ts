/**
 * E2E — Add New Post: initial state (select phase)
 *
 * Verifies the select-phase chrome renders correctly on a fresh page load,
 * before any files have been uploaded.
 */

import { test, expect } from '../fixtures';
import { text } from '../../features/posts/new/constants';

test.describe('Add New Post — initial state (select phase)', () => {
  test('renders the header title', async ({ addPostPage }) => {
    await expect(addPostPage.headerTitle).toBeVisible();
    await expect(addPostPage.headerTitle).toHaveText(text.headerTitle);
  });

  test('renders the Next button', async ({ addPostPage }) => {
    await expect(addPostPage.nextButton).toBeVisible();
    await expect(addPostPage.nextButton).toBeEnabled();
  });

  test('renders the Add button', async ({ addPostPage }) => {
    await expect(addPostPage.addButton).toBeVisible();
    await expect(addPostPage.addButton).toBeEnabled();
  });

  test('Share button is not visible in the select phase', async ({ addPostPage }) => {
    await expect(addPostPage.shareButton).not.toBeVisible();
  });

  test('shows the empty gallery placeholder text', async ({ addPostPage }) => {
    await expect(
      addPostPage.galleryContainer.getByText('تصویری انتخاب نشده'),
    ).toBeVisible();
  });

  test('shows the helper text prompting the user to add images', async ({ addPostPage }) => {
    await expect(
      addPostPage.galleryContainer.getByText(/اضافه کردن/),
    ).toBeVisible();
  });
});
