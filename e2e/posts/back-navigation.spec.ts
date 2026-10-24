/**
 * E2E — Add New Post: back navigation
 *
 * Verifies that returning from the details phase to the select phase
 * preserves completed uploads and prior selections.
 */

import { test, expect } from '../fixtures';

test.describe('Add New Post — back navigation', () => {
  test('the Previous button in the details phase returns to the select phase', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.assertOnDetailsPhase();

    await addPostPage.clickPrevious();
    await addPostPage.assertOnSelectPhase();
  });

  test('Next and Add buttons are visible again after returning to select phase', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.clickPrevious();

    await expect(addPostPage.nextButton).toBeVisible();
    await expect(addPostPage.addButton).toBeVisible();
  });

  test('previously selected images remain in the gallery after returning to select phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.clickPrevious();
    // The gallery cell with its thumbnail must still be rendered
    await expect(addPostPage.galleryContainer.locator('img')).toBeVisible();
  });

  test('previously selected items stay selected after returning to select phase', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.clickPrevious();
    // Selection badge "1" should still be visible — use exact to avoid matching the counter span
    await expect(addPostPage.galleryContainer.getByText('1', { exact: true })).toBeVisible();
  });
});
